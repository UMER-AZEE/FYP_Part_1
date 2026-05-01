import logging
import smtplib
from dataclasses import dataclass
from email.message import EmailMessage

from app.core.config import (
    SMTP_ENABLED,
    SMTP_FROM_EMAIL,
    SMTP_FROM_NAME,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_USE_SSL,
    SMTP_USE_TLS,
    SMTP_USERNAME,
)


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class EmailDeliveryResult:
    delivered: bool
    mode: str


def verification_message(verification_code: str) -> str:
    return '\n'.join(
        [
            'Your Centurion verification code is below.',
            '',
            f'Code: {verification_code}',
            '',
            'This code expires in 10 minutes.',
            'If you did not request this account, you can ignore this email.',
        ]
    )


def password_reset_message(verification_code: str) -> str:
    return '\n'.join(
        [
            'Your Centurion password reset code is below.',
            '',
            f'Code: {verification_code}',
            '',
            'This code expires in 10 minutes.',
            'If you did not request a password reset, you can ignore this email.',
        ]
    )


def send_email_with_code(
    recipient_email: str,
    *,
    subject: str,
    text_message: str,
) -> EmailDeliveryResult:
    if not SMTP_ENABLED:
        logger.info('SMTP not configured – console email delivery for %s\n%s\n%s', recipient_email, subject, text_message)
        return EmailDeliveryResult(delivered=False, mode='console')

    message = EmailMessage()
    message['Subject'] = subject
    message['From'] = f'{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>'
    message['To'] = recipient_email
    message.set_content(text_message)

    smtp_class = smtplib.SMTP_SSL if SMTP_USE_SSL else smtplib.SMTP
    try:
        with smtp_class(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            if SMTP_USE_TLS and not SMTP_USE_SSL:
                server.ehlo()
                server.starttls()
                server.ehlo()
            if SMTP_USERNAME:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(message)
        logger.info('Email delivered via SMTP to %s', recipient_email)
        return EmailDeliveryResult(delivered=True, mode='smtp')
    except (OSError, smtplib.SMTPException) as exc:
        logger.warning(
            'SMTP delivery failed for %s, falling back to console mode: %s',
            recipient_email,
            exc,
        )
        logger.info('%s\n%s', subject, text_message)
        return EmailDeliveryResult(delivered=False, mode='console')


def send_verification_email(recipient_email: str, verification_code: str) -> EmailDeliveryResult:
    return send_email_with_code(
        recipient_email,
        subject='Verify your Centurion account',
        text_message=verification_message(verification_code),
    )


def send_password_reset_email(recipient_email: str, verification_code: str) -> EmailDeliveryResult:
    return send_email_with_code(
        recipient_email,
        subject='Reset your Centurion password',
        text_message=password_reset_message(verification_code),
    )
