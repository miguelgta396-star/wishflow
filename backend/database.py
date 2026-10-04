import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'wishflow.db')

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Tabela de Usuários
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        has_seen_onboarding INTEGER DEFAULT 0,
        theme_preference TEXT DEFAULT 'dark',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Tabela de Itens
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL CHECK(category IN ('tenho', 'quero', 'preciso')),
        priority TEXT DEFAULT 'media' CHECK(priority IN ('baixa', 'media', 'alta')),
        price REAL DEFAULT 0.0,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    ''')
    
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_items_user_category ON items(user_id, category)')
    conn.commit()
    conn.close()

def seed_demo_user_if_needed():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT id FROM users WHERE email = ?', ('demo@wishflow.com',))
    user = cursor.fetchone()
    
    if not user:
        pwd_hash = generate_password_hash('demo123')
        cursor.execute(
            'INSERT INTO users (name, email, password_hash, has_seen_onboarding, theme_preference) VALUES (?, ?, ?, 0, ?)',
            ('Alexandre Silva', 'demo@wishflow.com', pwd_hash, 'dark')
        )
        user_id = cursor.lastrowid
        populate_demo_items(cursor, user_id)
        conn.commit()
    conn.close()

def populate_demo_items(cursor, user_id):
    cursor.execute('DELETE FROM items WHERE user_id = ?', (user_id,))
    
    sample_items = [
        # Itens que eu tenho (Inventário atual)
        {
            'title': 'MacBook Pro M3 Max',
            'description': 'Meu setup principal para desenvolvimento e produtividade diária.',
            'category': 'tenho',
            'priority': 'alta',
            'price': 22500.00,
            'image_url': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'
        },
        {
            'title': 'Cafeteira Italiana Bialetti Moka',
            'description': 'Café encorpado todas as manhãs. Essencial na minha rotina de foco.',
            'category': 'tenho',
            'priority': 'media',
            'price': 280.00,
            'image_url': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'
        },
        {
            'title': 'Fone Sony WH-1000XM5',
            'description': 'Cancelamento de ruído impecável para trabalhar em cafés e viagens.',
            'category': 'tenho',
            'priority': 'alta',
            'price': 2490.00,
            'image_url': 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80'
        },

        # Itens que eu quero (Lista de desejos/sonhos)
        {
            'title': 'Viagem para Quioto & Tóquio',
            'description': 'Experiência imersiva na cultura e arquitetura japonesa na primavera.',
            'category': 'quero',
            'priority': 'alta',
            'price': 18500.00,
            'image_url': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80'
        },
        {
            'title': 'Cadeira Herman Miller Embody',
            'description': 'Investimento na saúde lombar e postura ergonômica perfeita.',
            'category': 'quero',
            'priority': 'alta',
            'price': 12800.00,
            'image_url': 'https://images.unsplash.com/photo-1580481077195-c328a37db729?auto=format&fit=crop&w=800&q=80'
        },
        {
            'title': 'Câmera Leica Q3',
            'description': 'Fotografia de rua e memórias em altíssima resolução com lente Summilux.',
            'category': 'quero',
            'priority': 'media',
            'price': 34000.00,
            'image_url': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80'
        },

        # Itens que eu preciso (Necessidades imediatas)
        {
            'title': 'Monitor 4K Ultrawide 34"',
            'description': 'Substituição urgente do monitor secundário com defeito para organizar janelas.',
            'category': 'preciso',
            'priority': 'alta',
            'price': 3800.00,
            'image_url': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80'
        },
        {
            'title': 'Revisão e Troca de Pneus do Carro',
            'description': 'Manutenção preventiva de segurança para viagens de final de ano.',
            'category': 'preciso',
            'priority': 'alta',
            'price': 2400.00,
            'image_url': 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80'
        },
        {
            'title': 'Teclado Mecânico Ergonômico Split',
            'description': 'Alívio para tendinite nos punhos após longas sessões de código.',
            'category': 'preciso',
            'priority': 'media',
            'price': 1100.00,
            'image_url': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80'
        }
    ]
    
    for item in sample_items:
        cursor.execute('''
            INSERT INTO items (user_id, title, description, category, priority, price, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, item['title'], item['description'], item['category'], item['priority'], item['price'], item['image_url']))
