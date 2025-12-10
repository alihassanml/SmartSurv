"""
SmartSurv Professional Diagram Generator
Uses Graphviz for high-quality diagrams
Installation: pip install graphviz pillow
"""

from graphviz import Digraph
import os

def create_activity_diagram():
    """Activity Diagram - Illegal Activity Detection Flow"""
    dot = Digraph(comment='SmartSurv Activity Diagram', format='png')
    dot.attr(rankdir='TB', size='12,16', dpi='300')
    dot.attr('node', shape='box', style='rounded,filled', fillcolor='lightblue', 
             fontname='Arial', fontsize='11')
    
    # Nodes
    dot.node('start', 'Start:\nVideo Stream Received', shape='ellipse', fillcolor='lightgreen')
    dot.node('capture', 'Capture\nVideo Frame')
    dot.node('preprocess', 'Preprocess Frame\n(Resize & Normalize)')
    dot.node('detection', 'Run Deep Learning Model\n(YOLOv8/YOLOv9)')
    dot.node('check_det', 'Activity\nDetected?', shape='diamond', fillcolor='lightyellow')
    dot.node('check_conf', 'Confidence >\nThreshold?', shape='diamond', fillcolor='lightyellow')
    dot.node('log_low', 'Log Low Confidence\nDetection')
    dot.node('audio_check', 'Audio\nAvailable?', shape='diamond', fillcolor='lightyellow')
    dot.node('process_audio', 'Process Audio Stream')
    dot.node('audio_detect', 'Audio Event Detection')
    dot.node('fusion', 'Fuse Audio-Visual Data')
    dot.node('severity', 'Determine Alert Severity\n(LOW/MEDIUM/HIGH)')
    dot.node('extract', 'Extract Video Clip\n(10s before, 15s after)')
    dot.node('annotate', 'Add Annotations\n(Bounding Boxes)')
    dot.node('save', 'Save Evidence to Storage')
    dot.node('check_sev', 'Alert\nSeverity?', shape='diamond', fillcolor='lightyellow')
    dot.node('dash', 'Dashboard Alert Only', fillcolor='lightcyan')
    dot.node('email', 'Send Email Notification', fillcolor='orange')
    dot.node('whatsapp', 'Send WhatsApp + Email', fillcolor='salmon')
    dot.node('log', 'Log Event to JSON')
    dot.node('update', 'Update Real-time Dashboard')
    
    # Edges
    dot.edge('start', 'capture')
    dot.edge('capture', 'preprocess')
    dot.edge('preprocess', 'detection')
    dot.edge('detection', 'check_det')
    dot.edge('check_det', 'capture', label='No')
    dot.edge('check_det', 'check_conf', label='Yes')
    dot.edge('check_conf', 'log_low', label='No')
    dot.edge('log_low', 'capture')
    dot.edge('check_conf', 'audio_check', label='Yes')
    dot.edge('audio_check', 'process_audio', label='Yes')
    dot.edge('process_audio', 'audio_detect')
    dot.edge('audio_detect', 'fusion')
    dot.edge('fusion', 'severity')
    dot.edge('audio_check', 'severity', label='No')
    dot.edge('severity', 'extract')
    dot.edge('extract', 'annotate')
    dot.edge('annotate', 'save')
    dot.edge('save', 'check_sev')
    dot.edge('check_sev', 'dash', label='LOW')
    dot.edge('check_sev', 'email', label='MEDIUM')
    dot.edge('check_sev', 'whatsapp', label='HIGH')
    dot.edge('dash', 'log')
    dot.edge('email', 'log')
    dot.edge('whatsapp', 'log')
    dot.edge('log', 'update')
    dot.edge('update', 'capture')
    
    return dot


def create_usecase_diagram():
    """Use Case Diagram"""
    dot = Digraph(comment='SmartSurv Use Case Diagram', format='png')
    dot.attr(rankdir='LR', size='14,10', dpi='300')
    
    # Actors
    dot.attr('node', shape='box', style='filled', fillcolor='lightpink')
    dot.node('admin', '<<Actor>>\nSystem\nAdministrator')
    dot.node('secmgr', '<<Actor>>\nSecurity Operations\nManager')
    dot.node('field', '<<Actor>>\nField Security\nOfficer')
    
    # Use Cases
    dot.attr('node', shape='ellipse', fillcolor='lightblue')
    dot.node('uc1', 'Monitor Live\nCamera Feeds')
    dot.node('uc2', 'Detect Illegal\nActivities', fillcolor='salmon')
    dot.node('uc3', 'Search Person\nby Photo', fillcolor='lightgreen')
    dot.node('uc4', 'Track Person\nAcross Cameras')
    dot.node('uc5', 'Receive Real-time\nAlerts', fillcolor='orange')
    dot.node('uc6', 'Review Alert\nHistory')
    dot.node('uc7', 'Download Evidence\nClips')
    dot.node('uc8', 'Generate Incident\nReports')
    dot.node('uc9', 'Configure System\nSettings')
    dot.node('uc10', 'Manage User\nAccounts')
    dot.node('uc11', 'Monitor System\nPerformance')
    
    # Relationships
    dot.edge('admin', 'uc9')
    dot.edge('admin', 'uc10')
    dot.edge('admin', 'uc11')
    
    dot.edge('secmgr', 'uc1')
    dot.edge('secmgr', 'uc2')
    dot.edge('secmgr', 'uc3')
    dot.edge('secmgr', 'uc4')
    dot.edge('secmgr', 'uc5')
    dot.edge('secmgr', 'uc6')
    dot.edge('secmgr', 'uc7')
    dot.edge('secmgr', 'uc8')
    
    dot.edge('field', 'uc1')
    dot.edge('field', 'uc5')
    
    # Include relationships
    dot.edge('uc2', 'uc5', style='dashed', label='<<include>>')
    dot.edge('uc3', 'uc4', style='dashed', label='<<include>>')
    
    return dot


def create_class_diagram():
    """Class Diagram"""
    dot = Digraph(comment='SmartSurv Class Diagram', format='png')
    dot.attr(rankdir='TB', size='16,12', dpi='300')
    dot.attr('node', shape='record', style='filled', fillcolor='lightyellow')
    
    # Classes
    dot.node('camera', '{Camera|+ camera_id: String\\l+ location: String\\l+ rtsp_url: String\\l+ fps: int\\l|+ connect()\\l+ get_frame()\\l}')
    dot.node('stream', '{VideoStream|+ stream_id: String\\l+ is_running: bool\\l|+ start_stream()\\l+ read_frame()\\l}')
    dot.node('detection_model', '{DetectionModel|+ model_name: String\\l+ confidence_threshold: float\\l|+ detect(frame)\\l+ preprocess()\\l}')
    dot.node('detection', '{Detection|+ detection_id: String\\l+ activity_type: String\\l+ confidence: float\\l+ timestamp: DateTime\\l|+ get_snapshot()\\l}')
    dot.node('person', '{Person|+ person_id: String\\l+ embedding: ndarray\\l+ first_seen: DateTime\\l|+ add_detection()\\l+ get_trajectory()\\l}')
    dot.node('alert', '{Alert|+ alert_id: String\\l+ severity: String\\l+ status: String\\l|+ send_notification()\\l}')
    dot.node('evidence', '{EvidenceClip|+ clip_id: String\\l+ file_path: String\\l+ duration: int\\l|+ generate_clip()\\l}')
    
    # Relationships
    dot.edge('camera', 'stream', label='1 → *')
    dot.edge('stream', 'detection_model', label='processes')
    dot.edge('detection_model', 'detection', label='produces')
    dot.edge('detection', 'person', label='identifies')
    dot.edge('detection', 'alert', label='triggers')
    dot.edge('alert', 'evidence', label='includes')
    
    return dot


def create_er_diagram():
    """Entity-Relationship Diagram"""
    dot = Digraph(comment='SmartSurv ER Diagram', format='png')
    dot.attr(rankdir='TB', size='14,10', dpi='300')
    
    # Entities
    dot.attr('node', shape='box', style='filled', fillcolor='lightcyan')
    dot.node('camera', 'CAMERA\n━━━━━━━━\ncamera_id (PK)\nlocation\nrtsp_url\nis_active')
    dot.node('detection', 'DETECTION\n━━━━━━━━\ndetection_id (PK)\nactivity_type\nconfidence\ntimestamp\ncamera_id (FK)')
    dot.node('alert', 'ALERT\n━━━━━━━━\nalert_id (PK)\nseverity\nstatus\ndetection_id (FK)')
    dot.node('person', 'PERSON\n━━━━━━━━\nperson_id (PK)\nembedding_vector\nfirst_seen\nlast_seen')
    dot.node('user', 'USER\n━━━━━━━━\nuser_id (PK)\nusername\nemail\nrole')
    dot.node('evidence', 'EVIDENCE_CLIP\n━━━━━━━━\nclip_id (PK)\nfile_path\nstart_time\nend_time')
    dot.node('notification', 'NOTIFICATION\n━━━━━━━━\nnotification_id (PK)\nalert_id (FK)\nuser_id (FK)\nchannel_type')
    
    # Relationships
    dot.attr('edge', arrowhead='crow', arrowtail='crow')
    dot.edge('camera', 'detection', label='captures\n1:N')
    dot.edge('detection', 'alert', label='triggers\n1:N')
    dot.edge('detection', 'person', label='identifies\nN:M')
    dot.edge('alert', 'notification', label='sends\n1:N')
    dot.edge('user', 'notification', label='receives\n1:N')
    dot.edge('alert', 'evidence', label='references\n1:1')
    dot.edge('camera', 'evidence', label='records\n1:N')
    
    return dot


def create_deployment_diagram():
    """Deployment Diagram"""
    dot = Digraph(comment='SmartSurv Deployment Diagram', format='png')
    dot.attr(rankdir='TB', size='14,10', dpi='300')
    
    # Client Tier
    with dot.subgraph(name='cluster_client') as c:
        c.attr(label='Client Tier', style='filled', color='lightgrey')
        c.node('browser', '<<Device>>\nWeb Browser\nChrome/Firefox', shape='box3d', fillcolor='lightblue', style='filled')
        c.node('mobile', '<<Device>>\nMobile Device\niOS/Android', shape='box3d', fillcolor='lightblue', style='filled')
    
    # Application Server
    with dot.subgraph(name='cluster_app') as c:
        c.attr(label='Application Server (Ubuntu 20.04)', style='filled', color='lightgreen')
        c.node('fastapi', '<<Service>>\nFastAPI\nPort 8000', shape='component', fillcolor='yellow', style='filled')
        c.node('detection', '<<Service>>\nDetection Engine\nYOLOv8/v9', shape='component', fillcolor='orange', style='filled')
        c.node('reid', '<<Service>>\nPerson Re-ID\nModule', shape='component', fillcolor='pink', style='filled')
    
    # GPU Server
    with dot.subgraph(name='cluster_gpu') as c:
        c.attr(label='GPU Server', style='filled', color='lightyellow')
        c.node('gpu', '<<Hardware>>\nNVIDIA GPU\nRTX 3070+', shape='box3d', fillcolor='lightgreen', style='filled')
    
    # Camera Network
    with dot.subgraph(name='cluster_camera') as c:
        c.attr(label='Camera Network', style='filled', color='lightcyan')
        c.node('cam1', '<<Device>>\nIP Camera 1\nRTSP', shape='box3d', fillcolor='white', style='filled')
        c.node('cam2', '<<Device>>\nIP Camera N\nRTSP', shape='box3d', fillcolor='white', style='filled')
    
    # External Services
    with dot.subgraph(name='cluster_external') as c:
        c.attr(label='External Services', style='filled', color='pink')
        c.node('whatsapp', '<<API>>\nWhatsApp\nBusiness API', shape='component', fillcolor='lightgreen', style='filled')
        c.node('smtp', '<<Service>>\nEmail Server\nSMTP/TLS', shape='component', fillcolor='lightblue', style='filled')
    
    # Connections
    dot.edge('browser', 'fastapi', label='HTTPS')
    dot.edge('mobile', 'fastapi', label='HTTPS')
    dot.edge('fastapi', 'detection')
    dot.edge('fastapi', 'reid')
    dot.edge('detection', 'gpu', label='GPU\nAcceleration', style='dashed')
    dot.edge('reid', 'gpu', label='GPU\nAcceleration', style='dashed')
    dot.edge('cam1', 'detection', label='RTSP/TCP')
    dot.edge('cam2', 'detection', label='RTSP/TCP')
    dot.edge('fastapi', 'whatsapp', label='REST API')
    dot.edge('fastapi', 'smtp', label='Port 587')
    
    return dot


def create_state_diagram():
    """State Diagram - Alert Lifecycle"""
    dot = Digraph(comment='SmartSurv State Diagram', format='png')
    dot.attr(rankdir='TB', size='12,10', dpi='300')
    dot.attr('node', shape='box', style='rounded,filled', fillcolor='lightblue')
    
    # States
    dot.node('start', 'Start', shape='circle', fillcolor='black', fontcolor='white')
    dot.node('monitoring', 'Monitoring')
    dot.node('detected', 'Detection Triggered')
    dot.node('confidence', 'Confidence Check', fillcolor='lightyellow')
    dot.node('severity', 'Severity Determination', fillcolor='lightyellow')
    dot.node('low', 'Low Severity Alert', fillcolor='lightgreen')
    dot.node('medium', 'Medium Severity Alert', fillcolor='orange')
    dot.node('high', 'High Severity Alert', fillcolor='salmon')
    dot.node('pending', 'Alert Pending')
    dot.node('sent', 'Alert Sent')
    dot.node('await', 'Awaiting Acknowledgment')
    dot.node('ack', 'Acknowledged', fillcolor='lightgreen')
    dot.node('dismiss', 'Dismissed', fillcolor='lightgray')
    dot.node('escalate', 'Escalated', fillcolor='red', fontcolor='white')
    dot.node('investigate', 'Under Investigation')
    dot.node('resolved', 'Resolved', fillcolor='lightgreen')
    dot.node('archived', 'Archived', fillcolor='lightgray')
    dot.node('end', 'End', shape='doublecircle', fillcolor='black', fontcolor='white')
    
    # Transitions
    dot.edge('start', 'monitoring')
    dot.edge('monitoring', 'detected', label='Activity\nDetected')
    dot.edge('detected', 'confidence')
    dot.edge('confidence', 'monitoring', label='Below\nThreshold')
    dot.edge('confidence', 'severity', label='Above\nThreshold')
    dot.edge('severity', 'low', label='< 0.75')
    dot.edge('severity', 'medium', label='0.75-0.90')
    dot.edge('severity', 'high', label='> 0.90')
    dot.edge('low', 'pending')
    dot.edge('medium', 'pending')
    dot.edge('high', 'pending')
    dot.edge('pending', 'sent')
    dot.edge('sent', 'await')
    dot.edge('await', 'ack', label='Officer\nConfirms')
    dot.edge('await', 'dismiss', label='False\nPositive')
    dot.edge('await', 'escalate', label='Requires\nAction')
    dot.edge('ack', 'investigate')
    dot.edge('escalate', 'investigate')
    dot.edge('investigate', 'resolved')
    dot.edge('resolved', 'archived')
    dot.edge('dismiss', 'archived')
    dot.edge('archived', 'end', label='Retention\nExpired')
    
    return dot


def generate_all_diagrams(output_dir='smartsurv_diagrams'):
    """Generate all diagrams"""
    os.makedirs(output_dir, exist_ok=True)
    
    diagrams = {
        'activity_diagram': create_activity_diagram,
        'usecase_diagram': create_usecase_diagram,
        'class_diagram': create_class_diagram,
        'er_diagram': create_er_diagram,
        'deployment_diagram': create_deployment_diagram,
        'state_diagram': create_state_diagram
    }
    
    print("🎨 SmartSurv Diagram Generator")
    print("=" * 60)
    print()
    
    for name, func in diagrams.items():
        try:
            print(f"📊 Generating {name}...", end=' ')
            diagram = func()
            output_path = os.path.join(output_dir, name)
            diagram.render(output_path, cleanup=True)
            print(f"✅ Done!")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print()
    print(f"✨ All diagrams saved to: {os.path.abspath(output_dir)}")
    print()


if __name__ == "__main__":
    generate_all_diagrams()