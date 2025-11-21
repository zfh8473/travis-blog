import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from '@react-email/components';
import * as React from 'react';

/**
 * Props for PasswordResetEmail component.
 */
interface PasswordResetEmailProps {
  resetUrl: string;
  userName?: string;
}

/**
 * Password reset email template.
 * 
 * Displays a password reset link with clear instructions.
 * 
 * @param props - Email props
 * @returns React email component
 */
export function PasswordResetEmail({
  resetUrl,
  userName,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={title}>重置您的密码</Text>
          <Text style={paragraph}>
            {userName ? `您好，${userName}` : '您好'}，
          </Text>
          <Text style={paragraph}>
            我们收到了您重置密码的请求。请点击下面的按钮来重置您的密码：
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              重置密码
            </Button>
          </Section>
          <Text style={paragraph}>
            如果按钮无法点击，请复制以下链接到浏览器中打开：
          </Text>
          <Text style={link}>{resetUrl}</Text>
          <Hr style={hr} />
          <Text style={footer}>
            此链接将在 24 小时后过期。如果您没有请求重置密码，请忽略此邮件。
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Email styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const title = {
  fontSize: '24px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
  margin: '0 0 20px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.4',
  color: '#484848',
  margin: '0 0 15px',
};

const buttonContainer = {
  padding: '27px 0 27px',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  width: '200px',
  margin: '0 auto',
};

const link = {
  fontSize: '14px',
  color: '#2563eb',
  wordBreak: 'break-all' as const,
  margin: '0 0 15px',
};

const hr = {
  borderColor: '#cccccc',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0',
};

