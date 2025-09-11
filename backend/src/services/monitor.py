
except Exception as e:
    logger.error(f"Error scanning for incoming transactions: {str(e)}")
    db.session.rollback()  # ← CORRECT INDENTATION
