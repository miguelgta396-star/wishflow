from flask import Flask, request, jsonify, session, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
import os
import sqlite3
from database import get_connection, init_db, seed_demo_user_if_needed, populate_demo_items

app = Flask(__name__, static_folder='../static', static_url_path='/static')
app.secret_key = os.environ.get('SECRET_KEY', 'wishflow-super-secret-key-production-grade-2026')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Inicializa o banco de dados
init_db()
seed_demo_user_if_needed()

def get_current_user_id():
    return session.get('user_id')

# ==================== ROTAS DE AUTENTICAÇÃO ====================

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'authenticated': False, 'user': None}), 200
        
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, email, has_seen_onboarding, theme_preference, created_at FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        session.clear()
        return jsonify({'authenticated': False, 'user': None}), 200
        
    return jsonify({
        'authenticated': True,
        'user': dict(user)
    })

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    
    if not name or len(name) < 2:
        return jsonify({'error': 'Por favor, informe seu nome completo (mínimo 2 caracteres).'}), 400
        
    if not email or '@' not in email or '.' not in email:
        return jsonify({'error': 'Por favor, informe um e-mail válido.'}), 400
        
    if not password or len(password) < 6:
        return jsonify({'error': 'A senha deve conter no mínimo 6 caracteres.'}), 400
        
    pwd_hash = generate_password_hash(password)
    
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO users (name, email, password_hash, has_seen_onboarding, theme_preference) VALUES (?, ?, ?, 0, ?)',
            (name, email, pwd_hash, 'dark')
        )
        user_id = cursor.lastrowid
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Este e-mail já está cadastrado. Tente fazer login.'}), 409
        
    # Inicializa alguns itens de boas-vindas personalizados
    populate_demo_items(cursor, user_id)
    conn.commit()
    conn.close()
    
    session['user_id'] = user_id
    
    return jsonify({
        'success': True,
        'message': 'Conta criada com sucesso!',
        'user': {
            'id': user_id,
            'name': name,
            'email': email,
            'has_seen_onboarding': 0,
            'theme_preference': 'dark'
        }
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    
    if not email or not password:
        return jsonify({'error': 'Preencha o e-mail e a senha.'}), 400
        
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, email, password_hash, has_seen_onboarding, theme_preference FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    conn.close()
    
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'E-mail ou senha incorretos.'}), 401
        
    session['user_id'] = user['id']
    
    return jsonify({
        'success': True,
        'message': 'Login realizado com sucesso!',
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'has_seen_onboarding': user['has_seen_onboarding'],
            'theme_preference': user['theme_preference']
        }
    })

@app.route('/api/auth/demo-login', methods=['POST'])
def demo_login():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, email, has_seen_onboarding, theme_preference FROM users WHERE email = ?', ('demo@wishflow.com',))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        seed_demo_user_if_needed()
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT id, name, email, has_seen_onboarding, theme_preference FROM users WHERE email = ?', ('demo@wishflow.com',))
        user = cursor.fetchone()
        conn.close()
        
    session['user_id'] = user['id']
    return jsonify({
        'success': True,
        'message': 'Entrando como Convidado Demo',
        'user': dict(user)
    })

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Desconectado com sucesso.'})

@app.route('/api/auth/onboarding', methods=['POST'])
def update_onboarding():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Não autenticado.'}), 401
        
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET has_seen_onboarding = 1 WHERE id = ?', (user_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/auth/theme', methods=['POST'])
def update_theme():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Não autenticado.'}), 401
        
    data = request.get_json() or {}
    theme = data.get('theme', 'dark')
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET theme_preference = ? WHERE id = ?', (theme, user_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'theme': theme})

# ==================== ROTAS DE GESTÃO DE ITENS ====================

@app.route('/api/items', methods=['GET'])
def list_items():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Não autenticado.'}), 401
        
    query = request.args.get('q', '').strip().lower()
    category = request.args.get('category', '').strip().lower()
    priority = request.args.get('priority', '').strip().lower()
    
    sql = 'SELECT * FROM items WHERE user_id = ?'
    params = [user_id]
    
    if category and category in ('tenho', 'quero', 'preciso'):
        sql += ' AND category = ?'
        params.append(category)
        
    if priority and priority in ('baixa', 'media', 'alta'):
        sql += ' AND priority = ?'
        params.append(priority)
        
    if query:
        sql += ' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ?)'
        params.extend([f'%{query}%', f'%{query}%'])
        
    sql += ' ORDER BY id DESC'
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()
    
    items = [dict(row) for row in rows]
    return jsonify({'items': items})

@app.route('/api/items', methods=['POST'])
def create_item():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Não autenticado.'}), 401
        
    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    description = (data.get('description') or '').strip()
    category = data.get('category')
    priority = data.get('priority', 'media')
    image_url = (data.get('image_url') or '').strip()
    
    try:
        price = float(data.get('price') or 0.0)
    except (ValueError, TypeError):
        price = 0.0
        
    if not title:
        return jsonify({'error': 'O título do item é obrigatório.'}), 400
        
    if category not in ('tenho', 'quero', 'preciso'):
        return jsonify({'error': 'Categoria inválida. Escolha entre: tenho, quero ou preciso.'}), 400
        
    if priority not in ('baixa', 'media', 'alta'):
        priority = 'media'
        
    # Se não houver imagem fornecida, aplicar imagem padrão moderna elegante
    if not image_url:
        default_images = {
            'tenho': 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
            'quero': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
            'preciso': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80'
        }
        image_url = default_images.get(category)
        
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO items (user_id, title, description, category, priority, price, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, title, description, category, priority, price, image_url))
    item_id = cursor.lastrowid
    conn.commit()
    
    cursor.execute('SELECT * FROM items WHERE id = ?', (item_id,))
    new_item = cursor.fetchone()
    conn.close()
    
    return jsonify({
        'success': True,
        'message': 'Item adicionado com sucesso!',
        'item': dict(new_item)
    }), 201

@app.route('/api/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Não autenticado.'}), 401
        
    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    description = (data.get('description') or '').strip()
    category = data.get('category')
    priority = data.get('priority', 'media')
    image_url = (data.get('image_url') or '').strip()
    
    try:
        price = float(data.get('price') or 0.0)
    except (ValueError, TypeError):
        price = 0.0
        
    if not title:
        return jsonify({'error': 'O título do item é obrigatório.'}), 400
        
    if category not in ('tenho', 'quero', 'preciso'):
        return jsonify({'error': 'Categoria inválida.'}), 400
        
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM items WHERE id = ? AND user_id = ?', (item_id, user_id))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'error': 'Item não encontrado ou acesso não autorizado.'}), 404
        
    cursor.execute('''
        UPDATE items 
        SET title = ?, description = ?, category = ?, priority = ?, price = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
    ''', (title, description, category, priority, price, image_url, item_id, user_id))
    conn.commit()
    
    cursor.execute('SELECT * FROM items WHERE id = ?', (item_id,))
    updated_item = cursor.fetchone()
    conn.close()
    
    return jsonify({
        'success': True,
        'message': 'Item atualizado com sucesso!',
        'item': dict(updated_item)
    })

@app.route('/api/items/<int:item_id>/move', methods=['PATCH'])
def move_item_category(item_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Não autenticado.'}), 401
        
    data = request.get_json() or {}
    new_category = data.get('category')
    
    if new_category not in ('tenho', 'quero', 'preciso'):
        return jsonify({'error': 'Categoria de destino inválida.'}), 400
        
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, category FROM items WHERE id = ? AND user_id = ?', (item_id, user_id))
    item = cursor.fetchone()
    
    if not item:
        conn.close()
        return jsonify({'error': 'Item não encontrado.'}), 404
        
    old_category = item['category']
    is_achievement = (old_category in ('quero', 'preciso') and new_category == 'tenho')
    
    cursor.execute('''
        UPDATE items 
        SET category = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
    ''', (new_category, item_id, user_id))
    conn.commit()
    
    cursor.execute('SELECT * FROM items WHERE id = ?', (item_id,))
    updated_item = cursor.fetchone()
    conn.close()
    
    return jsonify({
        'success': True,
        'message': f'Item movido para "{new_category.capitalize()}"!',
        'is_achievement': is_achievement,
        'item': dict(updated_item)
    })

@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Não autenticado.'}), 401
        
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM items WHERE id = ? AND user_id = ?', (item_id, user_id))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'error': 'Item não encontrado.'}), 404
        
    cursor.execute('DELETE FROM items WHERE id = ? AND user_id = ?', (item_id, user_id))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Item removido com sucesso.'})

@app.route('/api/stats', methods=['GET'])
def get_stats():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Não autenticado.'}), 401
        
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT category, COUNT(*) as count, COALESCE(SUM(price), 0) as total_price
        FROM items
        WHERE user_id = ?
        GROUP BY category
    ''', (user_id,))
    rows = cursor.fetchall()
    
    stats = {
        'tenho': {'count': 0, 'total_price': 0.0},
        'quero': {'count': 0, 'total_price': 0.0},
        'preciso': {'count': 0, 'total_price': 0.0},
        'total_items': 0,
        'total_value': 0.0
    }
    
    for row in rows:
        cat = row['category']
        stats[cat]['count'] = row['count']
        stats[cat]['total_price'] = row['total_price']
        stats['total_items'] += row['count']
        stats['total_value'] += row['total_price']
        
    # Calcular taxa de realização se houver itens
    total_desejos_e_tenho = stats['tenho']['count'] + stats['quero']['count']
    if total_desejos_e_tenho > 0:
        stats['achievement_rate'] = round((stats['tenho']['count'] / total_desejos_e_tenho) * 100, 1)
    else:
        stats['achievement_rate'] = 0.0
        
    conn.close()
    return jsonify({'stats': stats})

@app.route('/api/demo/reset', methods=['POST'])
def reset_demo_data():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Não autenticado.'}), 401
        
    conn = get_connection()
    cursor = conn.cursor()
    populate_demo_items(cursor, user_id)
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Dados de exemplo restaurados com sucesso!'})

# ==================== ROTAS DE SERVIÇO DE FRONTEND ====================

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"[*] WishFlow App iniciado em http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
