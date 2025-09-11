from flask_mail import Message, Mail
from flask import current_app, render_template_string
from datetime import datetime
import threading

class EmailService:
    """Email notification service"""
    
    def __init__(self, mail: Mail):
        self.mail = mail
    
    def send_async_email(self, msg):
        """Send email asynchronously"""
        with current_app.app_context():
            try:
                self.mail.send(msg)
            except Exception as e:
                current_app.logger.error(f"Failed to send email: {e}")
    
    def send_email(self, to: str, subject: str, html_body: str, text_body: str = None):
        """Send email with both HTML and text versions"""
        try:
            msg = Message(
                subject=subject,
                sender=current_app.config['MAIL_DEFAULT_SENDER'],
                recipients=[to]
            )
            
            if text_body:
                msg.body = text_body
            msg.html = html_body
            
            # Send asynchronously
            thread = threading.Thread(target=self.send_async_email, args=[msg])
            thread.daemon = True
            thread.start()
            
            return {'success': True, 'message': 'Email queued for sending'}
            
        except Exception as e:
            return {'success': False, 'error': f'Failed to queue email: {str(e)}'}
    
    def send_welcome_email(self, user_email: str, user_name: str):
        """Send welcome email to new user"""
        subject = "Welcome to Payoova - Your Crypto Wallet is Ready!"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome to Payoova</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚀 Welcome to Payoova!</h1>
                    <p>Your journey into the world of cryptocurrency starts here</p>
                </div>
                <div class="content">
                    <h2>Hi {user_name}!</h2>
                    <p>Thank you for joining Payoova, the most secure and user-friendly crypto wallet platform.</p>
                    
                    <h3>What you can do with Payoova:</h3>
                    <ul>
                        <li>✅ Generate wallets for multiple networks (Ethereum, Polygon, BSC)</li>
                        <li>✅ Send and receive cryptocurrencies securely</li>
                        <li>✅ Track your transaction history</li>
                        <li>✅ Monitor your portfolio in real-time</li>
                        <li>✅ Generate QR codes for easy payments</li>
                    </ul>
                    
                    <p>Ready to get started?</p>
                    <a href="https://payoova.com/dashboard" class="button">Access Your Dashboard</a>
                    
                    <h3>Security Tips:</h3>
                    <ul>
                        <li>🔐 Never share your private keys with anyone</li>
                        <li>🔐 Always verify recipient addresses before sending</li>
                        <li>🔐 Keep your account credentials secure</li>
                        <li>🔐 Enable two-factor authentication when available</li>
                    </ul>
                </div>
                <div class="footer">
                    <p>Need help? Contact us at support@payoova.com</p>
                    <p>© 2024 Payoova. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Welcome to Payoova, {user_name}!
        
        Thank you for joining the most secure crypto wallet platform.
        
        What you can do:
        - Generate wallets for Ethereum, Polygon, BSC
        - Send and receive cryptocurrencies
        - Track transaction history
        - Monitor portfolio
        
        Access your dashboard: https://payoova.com/dashboard
        
        Security Tips:
        - Never share private keys
        - Verify addresses before sending
        - Keep credentials secure
        
        Need help? Contact support@payoova.com
        """
        
        return self.send_email(user_email, subject, html_body, text_body)
    
    def send_transaction_notification(self, user_email: str, user_name: str, 
                                    transaction_data: dict):
        """Send transaction notification email"""
        tx_type = transaction_data.get('transaction_type', 'transaction')
        amount = transaction_data.get('amount', '0')
        currency = transaction_data.get('currency', 'ETH')
        tx_hash = transaction_data.get('transaction_hash', '')
        network = transaction_data.get('network', 'ethereum')
        status = transaction_data.get('status', 'pending')
        
        subject = f"Payoova: {tx_type.title()} Transaction {status.title()}"
        
        # Get explorer URL
        explorers = {
            'ethereum': 'https://etherscan.io/tx/',
            'polygon': 'https://polygonscan.com/tx/',
            'bsc': 'https://bscscan.com/tx/'
        }
        explorer_url = explorers.get(network, '') + tx_hash
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Transaction Notification</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .transaction-box {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }}
                .status-pending {{ color: #f39c12; }}
                .status-confirmed {{ color: #27ae60; }}
                .status-failed {{ color: #e74c3c; }}
                .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 Transaction Update</h1>
                    <p>Your {tx_type} transaction has been {status}</p>
                </div>
                <div class="content">
                    <h2>Hi {user_name}!</h2>
                    
                    <div class="transaction-box">
                        <h3>Transaction Details</h3>
                        <p><strong>Type:</strong> {tx_type.title()}</p>
                        <p><strong>Amount:</strong> {amount} {currency}</p>
                        <p><strong>Network:</strong> {network.title()}</p>
                        <p><strong>Status:</strong> <span class="status-{status}">{status.title()}</span></p>
                        <p><strong>Transaction Hash:</strong><br>
                           <code style="word-break: break-all; background: #f4f4f4; padding: 5px;">{tx_hash}</code></p>
                        <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                    </div>
                    
                    <p>You can view this transaction on the blockchain explorer:</p>
                    <a href="{explorer_url}" class="button" target="_blank">View on Explorer</a>
                    
                    <p><small>This is an automated notification. Please do not reply to this email.</small></p>
                </div>
                <div class="footer">
                    <p>© 2024 Payoova. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Transaction Update - Payoova
        
        Hi {user_name}!
        
        Your {tx_type} transaction has been {status}.
        
        Transaction Details:
        - Type: {tx_type.title()}
        - Amount: {amount} {currency}
        - Network: {network.title()}
        - Status: {status.title()}
        - Hash: {tx_hash}
        - Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}
        
        View on explorer: {explorer_url}
        
        © 2024 Payoova
        """
        
        return self.send_email(user_email, subject, html_body, text_body)
    
    def send_security_alert(self, user_email: str, user_name: str, alert_type: str, 
                          details: str = ""):
        """Send security alert email"""
        subject = f"Payoova Security Alert: {alert_type}"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Security Alert</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #e74c3c; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .alert-box {{ background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .button {{ display: inline-block; background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚨 Security Alert</h1>
                    <p>Important security notification for your account</p>
                </div>
                <div class="content">
                    <h2>Hi {user_name}!</h2>
                    
                    <div class="alert-box">
                        <h3>⚠️ {alert_type}</h3>
                        <p>{details}</p>
                        <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                    </div>
                    
                    <p>If this was not you, please secure your account immediately:</p>
                    <ul>
                        <li>Change your password</li>
                        <li>Review your recent transactions</li>
                        <li>Contact support if needed</li>
                    </ul>
                    
                    <a href="https://payoova.com/security" class="button">Secure My Account</a>
                </div>
                <div class="footer">
                    <p>Need help? Contact us at security@payoova.com</p>
                    <p>© 2024 Payoova. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        SECURITY ALERT - Payoova
        
        Hi {user_name}!
        
        Security Alert: {alert_type}
        Details: {details}
        Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}
        
        If this was not you:
        - Change your password immediately
        - Review recent transactions
        - Contact security@payoova.com
        
        Secure your account: https://payoova.com/security
        
        © 2024 Payoova
        """
        
        return self.send_email(user_email, subject, html_body, text_body)

# Global email service instance
email_service = None

def get_email_service(mail: Mail):
    """Get email service instance"""
    global email_service
    if email_service is None:
        email_service = EmailService(mail)
    return email_service
