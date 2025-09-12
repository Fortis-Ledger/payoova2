from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from src.services.blockchain import get_price_service
import asyncio

price_bp = Blueprint('price', __name__)

@price_bp.route('/price/<symbol>', methods=['GET'])
@cross_origin()
def get_crypto_price(symbol):
    """Get current price for a cryptocurrency"""
    try:
        vs_currency = request.args.get('vs_currency', 'usd')
        
        price_service = get_price_service()
        result = asyncio.run(price_service.get_price(symbol, vs_currency))
        
        if result['success']:
            return jsonify({
                'success': True,
                'symbol': result['symbol'],
                'price': result['price'],
                'change_24h': result['change_24h'],
                'vs_currency': result['vs_currency'],
                'mock': result.get('mock', False)
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get price: {str(e)}'
        }), 500

@price_bp.route('/prices', methods=['POST'])
@cross_origin()
def get_multiple_prices():
    """Get prices for multiple cryptocurrencies"""
    try:
        data = request.get_json() or {}
        symbols = data.get('symbols', [])
        vs_currency = data.get('vs_currency', 'usd')
        
        if not symbols:
            return jsonify({
                'success': False,
                'error': 'No symbols provided'
            }), 400
        
        price_service = get_price_service()
        prices = {}
        
        for symbol in symbols:
            result = asyncio.run(price_service.get_price(symbol, vs_currency))
            if result['success']:
                prices[symbol] = {
                    'price': result['price'],
                    'change_24h': result['change_24h'],
                    'mock': result.get('mock', False)
                }
            else:
                prices[symbol] = {
                    'error': result['error']
                }
        
        return jsonify({
            'success': True,
            'prices': prices,
            'vs_currency': vs_currency
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get prices: {str(e)}'
        }), 500

@price_bp.route('/portfolio-value', methods=['POST'])
@cross_origin()
def calculate_portfolio_value():
    """Calculate total portfolio value"""
    try:
        data = request.get_json() or {}
        holdings = data.get('holdings', {})  # {symbol: amount}
        vs_currency = data.get('vs_currency', 'usd')
        
        if not holdings:
            return jsonify({
                'success': True,
                'total_value': 0,
                'breakdown': {},
                'vs_currency': vs_currency
            })
        
        price_service = get_price_service()
        total_value = 0
        breakdown = {}
        
        for symbol, amount in holdings.items():
            try:
                amount_float = float(amount)
                result = asyncio.run(price_service.get_price(symbol, vs_currency))
                
                if result['success']:
                    price = result['price']
                    value = amount_float * price
                    total_value += value
                    
                    breakdown[symbol] = {
                        'amount': amount_float,
                        'price': price,
                        'value': value,
                        'change_24h': result['change_24h']
                    }
                else:
                    breakdown[symbol] = {
                        'amount': amount_float,
                        'error': result['error']
                    }
            except ValueError:
                breakdown[symbol] = {
                    'error': 'Invalid amount format'
                }
        
        return jsonify({
            'success': True,
            'total_value': total_value,
            'breakdown': breakdown,
            'vs_currency': vs_currency
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to calculate portfolio value: {str(e)}'
        }), 500
