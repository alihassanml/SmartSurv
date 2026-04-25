from database import engine, Base, Alert
Base.metadata.create_all(bind=engine)
print("Tables checked/created.")
