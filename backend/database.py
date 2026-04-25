from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./smartsurv.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_code = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    role = Column(String, default="admin") # admin, user, or organization
    is_approved = Column(Boolean, default=True, nullable=False) # Admins need approval
    organization_type = Column(String, nullable=True) # Police Station, Hospital, etc.
    organization_address = Column(String, nullable=True)
    allowed_notifications = Column(Text, default='["person", "knife", "gun", "smoking", "violence", "watchlist_match"]') # JSON list

class Camera(Base):
    """Online / URL cameras managed via the Cameras page."""
    __tablename__ = "cameras"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    grid_position = Column(Integer, default=0)
    is_active = Column(Boolean, default=False)   # streaming on/off (default OFF)
    is_visible = Column(Boolean, default=True)   # eye toggle — feed shown on monitor

class Setting(Base):
    """Key-value store for persistent settings (thresholds, sounds, etc.)."""
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)

class Alert(Base):
    """Historical record of security alerts."""
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(String, nullable=False) # Human readable
    backend_ts = Column(Integer, index=True) # ms since epoch
    feed_id = Column(String, nullable=False)
    detections = Column(Text, nullable=False) # JSON string
    is_person_search_match = Column(Boolean, default=False)
    image_base64 = Column(Text, nullable=True) # Optional: keep small or store path
    location_lat = Column(String, nullable=True)
    location_lon = Column(String, nullable=True)

Base.metadata.create_all(bind=engine)

# --- SQLite migration: add new columns to existing tables if missing ---
def _run_migrations():
    from sqlalchemy import text, inspect
    with engine.connect() as conn:
        inspector = inspect(engine)

        # users table
        existing_users = {col["name"] for col in inspector.get_columns("users")}
        for col, ddl in [
            ("is_verified",       "BOOLEAN NOT NULL DEFAULT 0"),
            ("verification_code", "VARCHAR"),
            ("is_active",         "BOOLEAN NOT NULL DEFAULT 1"),
            ("is_admin",          "BOOLEAN NOT NULL DEFAULT 0"),
            ("role",              "VARCHAR DEFAULT 'admin'"),
            ("is_approved",       "BOOLEAN NOT NULL DEFAULT 1"),
            ("organization_type", "VARCHAR"),
            ("organization_address", "VARCHAR"),
            ("allowed_notifications", "TEXT DEFAULT '[\"person\", \"knife\", \"gun\", \"smoking\", \"violence\", \"watchlist_match\"]'"),
        ]:
            if col not in existing_users:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {ddl}"))

        # cameras table — created fresh by SQLAlchemy, but guard for old DBs
        if inspector.has_table("cameras"):
            existing_cams = {col["name"] for col in inspector.get_columns("cameras")}
            if "is_active" not in existing_cams:
                conn.execute(text("ALTER TABLE cameras ADD COLUMN is_active BOOLEAN DEFAULT 0"))
            if "grid_position" not in existing_cams:
                conn.execute(text("ALTER TABLE cameras ADD COLUMN grid_position INTEGER DEFAULT 0"))
            if "is_visible" not in existing_cams:
                conn.execute(text("ALTER TABLE cameras ADD COLUMN is_visible BOOLEAN NOT NULL DEFAULT 1"))

        conn.commit()

_run_migrations()
