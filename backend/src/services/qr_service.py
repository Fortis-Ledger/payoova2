import qrcode
from io import BytesIO
import base64
from PIL import Image, ImageDraw
from flask import current_app
import os

class QRCodeService:
    """QR Code generation service for cryptocurrency addresses and transactions"""
    
    def __init__(self):
        self.default_size = 256
        self.border = 4
        self.box_size = 10
    
    def generate_address_qr(self, address: str, network: str, amount: str = None) -> dict:
        """Generate QR code for cryptocurrency address"""
        try:
            # Create payment URI based on network
            if network.lower() == 'ethereum':
                uri = f"ethereum:{address}"
            elif network.lower() == 'bitcoin':
                uri = f"bitcoin:{address}"
            else:
                # Generic format for other networks
                uri = f"{network}:{address}"
            
            # Add amount if specified
            if amount:
                uri += f"?amount={amount}"
            
            # Generate QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=self.box_size,
                border=self.border,
            )
            qr.add_data(uri)
            qr.make(fit=True)
            
            # Create image
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64
            buffered = BytesIO()
            img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            
            return {
                'success': True,
                'qr_code': f"data:image/png;base64,{img_str}",
                'uri': uri,
                'address': address,
                'network': network,
                'amount': amount
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to generate QR code: {str(e)}"
            }
    
    def generate_transaction_qr(self, tx_hash: str, network: str) -> dict:
        """Generate QR code for transaction hash"""
        try:
            # Create explorer URL based on network
            explorers = {
                'ethereum': 'https://etherscan.io/tx/',
                'polygon': 'https://polygonscan.com/tx/',
                'bsc': 'https://bscscan.com/tx/'
            }
            
            explorer_url = explorers.get(network.lower(), '') + tx_hash
            
            # Generate QR code for transaction URL
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=self.box_size,
                border=self.border,
            )
            qr.add_data(explorer_url)
            qr.make(fit=True)
            
            # Create image
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64
            buffered = BytesIO()
            img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            
            return {
                'success': True,
                'qr_code': f"data:image/png;base64,{img_str}",
                'url': explorer_url,
                'tx_hash': tx_hash,
                'network': network
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to generate transaction QR code: {str(e)}"
            }
    
    def generate_payment_request_qr(self, address: str, network: str, amount: str, 
                                   message: str = None, label: str = None) -> dict:
        """Generate QR code for payment request with additional parameters"""
        try:
            # Build URI with parameters
            if network.lower() == 'ethereum':
                uri = f"ethereum:{address}"
            else:
                uri = f"{network}:{address}"
            
            params = []
            if amount:
                params.append(f"amount={amount}")
            if message:
                params.append(f"message={message}")
            if label:
                params.append(f"label={label}")
            
            if params:
                uri += "?" + "&".join(params)
            
            # Generate QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=self.box_size,
                border=self.border,
            )
            qr.add_data(uri)
            qr.make(fit=True)
            
            # Create image with custom styling
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Add logo if available (optional enhancement)
            # self._add_logo(img, network)
            
            # Convert to base64
            buffered = BytesIO()
            img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            
            return {
                'success': True,
                'qr_code': f"data:image/png;base64,{img_str}",
                'uri': uri,
                'address': address,
                'network': network,
                'amount': amount,
                'message': message,
                'label': label
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to generate payment request QR code: {str(e)}"
            }
    
    def _add_logo(self, qr_img, network: str):
        """Add network logo to QR code center (optional enhancement)"""
        try:
            # This would add a small logo in the center of the QR code
            # Implementation depends on having logo files available
            logo_path = f"static/logos/{network.lower()}.png"
            
            if os.path.exists(logo_path):
                logo = Image.open(logo_path)
                
                # Calculate logo size (10% of QR code)
                qr_width, qr_height = qr_img.size
                logo_size = min(qr_width, qr_height) // 10
                
                # Resize logo
                logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
                
                # Create circular mask for logo
                mask = Image.new('L', (logo_size, logo_size), 0)
                draw = ImageDraw.Draw(mask)
                draw.ellipse((0, 0, logo_size, logo_size), fill=255)
                
                # Apply mask to logo
                logo.putalpha(mask)
                
                # Calculate position to center logo
                pos_x = (qr_width - logo_size) // 2
                pos_y = (qr_height - logo_size) // 2
                
                # Paste logo onto QR code
                qr_img.paste(logo, (pos_x, pos_y), logo)
                
        except Exception as e:
            # If logo addition fails, continue without it
            current_app.logger.warning(f"Failed to add logo to QR code: {e}")
            pass

# Singleton instance
qr_service = None

def get_qr_service():
    """Get QR service instance"""
    global qr_service
    if qr_service is None:
        qr_service = QRCodeService()
    return qr_service
