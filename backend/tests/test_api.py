import pytest
import json
from flask import Flask
from src.main import app, db
from src.models.user import User, Wallet, Transaction, AuthToken


@pytest.fixture
def client():
    """Test client fixture"""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()


@pytest.fixture
def test_user():
    """Create a test user"""
    user = User(
        name='Test User',
        email='test@example.com',
        role='user'
    )
    user.set_password('testpass123')
    db.session.add(user)
    db.session.commit()
    return user


class TestAuthAPI:
    """Test authentication endpoints"""

    def test_register_user(self, client):
        """Test user registration"""
        response = client.post('/api/auth/signup', json={
            'name': 'New User',
            'email': 'newuser@example.com',
            'password': 'password123'
        })

        assert response.status_code == 201
        data = json.loads(response.data)
        assert 'user' in data
        assert data['user']['email'] == 'newuser@example.com'

    def test_login_user(self, client, test_user):
        """Test user login"""
        response = client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'testpass123'
        })

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'user' in data
        assert 'token' in data

    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials"""
        response = client.post('/api/auth/login', json={
            'email': 'invalid@example.com',
            'password': 'wrongpassword'
        })

        assert response.status_code == 401

    def test_verify_token(self, client, test_user):
        """Test token verification"""
        # First login to get token
        login_response = client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        token = json.loads(login_response.data)['token']

        # Verify token
        response = client.get('/api/auth/verify',
                            headers={'Authorization': f'Bearer {token}'})

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['email'] == 'test@example.com'


class TestWalletAPI:
    """Test wallet endpoints"""

    def test_create_wallet(self, client, test_user):
        """Test wallet creation"""
        # First login to get token
        login_response = client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        token = json.loads(login_response.data)['token']

        response = client.post('/api/wallet/create/ethereum',
                             headers={'Authorization': f'Bearer {token}'})

        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'wallet' in data

    def test_get_wallet_balance(self, client, test_user):
        """Test getting wallet balance"""
        # Create a wallet first
        login_response = client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        token = json.loads(login_response.data)['token']

        # Create wallet
        client.post('/api/wallet/create/ethereum',
                   headers={'Authorization': f'Bearer {token}'})

        # Get balance
        response = client.get('/api/wallet/balance/ethereum',
                            headers={'Authorization': f'Bearer {token}'})

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'balance' in data

    def test_send_crypto_insufficient_balance(self, client, test_user):
        """Test sending crypto with insufficient balance"""
        login_response = client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        token = json.loads(login_response.data)['token']

        response = client.post('/api/wallet/transfer',
                             headers={'Authorization': f'Bearer {token}'},
                             json={
                                 'from_address': '0x1234567890123456789012345678901234567890',
                                 'to_address': '0x0987654321098765432109876543210987654321',
                                 'amount': '1000',
                                 'network': 'ethereum'
                             })

        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['success'] is False


class TestHealthCheck:
    """Test health check endpoint"""

    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get('/api/health')

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert 'timestamp' in data
        assert 'version' in data


class TestQRCodeAPI:
    """Test QR code endpoints"""

    def test_generate_address_qr(self, client, test_user):
        """Test QR code generation for address"""
        login_response = client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        token = json.loads(login_response.data)['token']

        response = client.get('/api/qr/address/ethereum',
                            headers={'Authorization': f'Bearer {token}'})

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'qr_code' in data
        assert 'uri' in data

    def test_validate_qr_data(self, client):
        """Test QR code data validation"""
        response = client.post('/api/qr/validate', json={
            'qr_data': '0x1234567890123456789012345678901234567890'
        })

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'is_valid' in data
        assert 'address_type' in data


if __name__ == '__main__':
    pytest.main([__file__])