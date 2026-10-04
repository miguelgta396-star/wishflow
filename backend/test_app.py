from app import app
import json

client = app.test_client()

# 1. Testar Rota Principal
res = client.get('/')
assert res.status_code == 200, f'Status root {res.status_code}'
assert b'WishFlow' in res.data, 'Root content mismatch'

# 2. Testar Login Demo
res = client.post('/api/auth/demo-login')
assert res.status_code == 200, f'Status demo login {res.status_code}'
data = res.get_json()
assert data['success'] is True, 'Login failed'

# 3. Testar Listagem de Itens
res = client.get('/api/items')
assert res.status_code == 200
items = res.get_json()['items']
assert len(items) >= 9, f'Expected at least 9 items, got {len(items)}'

# 4. Testar Criação de Item
new_item = {
    'title': 'iPad Pro M4',
    'description': 'Tablet para ilustrações e wireframes',
    'category': 'quero',
    'priority': 'alta',
    'price': 9800.00
}
res = client.post('/api/items', json=new_item)
assert res.status_code == 201, f'Create item status {res.status_code}'
created = res.get_json()['item']
assert created['title'] == 'iPad Pro M4'

# 5. Testar Mover Item para Tenho (Conquista!)
item_id = created['id']
res = client.patch(f'/api/items/{item_id}/move', json={'category': 'tenho'})
assert res.status_code == 200
move_res = res.get_json()
assert move_res['is_achievement'] is True, 'Should be an achievement'

# 6. Testar Estatísticas
res = client.get('/api/stats')
assert res.status_code == 200
stats = res.get_json()['stats']
assert stats['total_items'] >= 10
assert stats['tenho']['count'] >= 4

# 7. Testar Remoção
res = client.delete(f'/api/items/{item_id}')
assert res.status_code == 200

print('✅ TODOS OS 7 TESTES DE INTEGRAÇÃO PASSARAM COM SUCESSO!')
