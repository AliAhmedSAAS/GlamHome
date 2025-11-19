import axios from 'axios';
import twilio from 'twilio';

interface WhatsAppMessage {
  to: string;
  body: string;
}

interface SendResult {
  success: boolean;
  provider: 'ultramessage' | 'twilio';
  messageId?: string;
  error?: string;
}

class WhatsAppService {
  private ultramsgToken: string;
  private ultramsgInstanceId: string;
  private twilioClient: any;
  private twilioWhatsAppNumber: string;

  constructor() {
    this.ultramsgToken = process.env.ULTRAMSG_TOKEN || '';
    this.ultramsgInstanceId = process.env.ULTRAMSG_INSTANCE_ID || '';
    this.twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || '';

    // Initialize Twilio client if credentials are available AND valid format
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    // Only initialize if both values exist and SID starts with "AC"
    if (twilioSid && twilioToken && twilioSid.startsWith('AC')) {
      this.twilioClient = twilio(twilioSid, twilioToken);
    }
  }

  /**
   * Send WhatsApp message using Ultramessage (primary) with Twilio fallback
   */
  async sendMessage(message: WhatsAppMessage): Promise<SendResult> {
    // Try Ultramessage first
    if (this.ultramsgToken && this.ultramsgInstanceId) {
      try {
        const result = await this.sendViaUltramessage(message);
        if (result.success) {
          return result;
        }
        console.log('Ultramessage failed, trying Twilio fallback:', result.error);
      } catch (error) {
        console.error('Ultramessage error:', error);
      }
    }

    // Fallback to Twilio
    if (this.twilioClient && this.twilioWhatsAppNumber) {
      try {
        return await this.sendViaTwilio(message);
      } catch (error) {
        console.error('Twilio error:', error);
        return {
          success: false,
          provider: 'twilio',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return {
      success: false,
      provider: 'ultramessage',
      error: 'No WhatsApp provider configured',
    };
  }

  /**
   * Send message via Ultramessage
   */
  private async sendViaUltramessage(message: WhatsAppMessage): Promise<SendResult> {
    const url = `https://api.ultramsg.com/${this.ultramsgInstanceId}/messages/chat`;
    
    try {
      const response = await axios.post(url, {
        token: this.ultramsgToken,
        to: message.to,
        body: message.body,
      });

      if (response.data && response.data.sent) {
        return {
          success: true,
          provider: 'ultramessage',
          messageId: response.data.id,
        };
      }

      return {
        success: false,
        provider: 'ultramessage',
        error: response.data?.error || 'Message not sent',
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          provider: 'ultramessage',
          error: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  }

  /**
   * Send message via Twilio
   */
  private async sendViaTwilio(message: WhatsAppMessage): Promise<SendResult> {
    try {
      // Ensure number is in international format
      const toNumber = message.to.startsWith('+') ? message.to : `+${message.to}`;
      const formattedTo = toNumber.startsWith('whatsapp:') ? toNumber : `whatsapp:${toNumber}`;
      const formattedFrom = this.twilioWhatsAppNumber.startsWith('whatsapp:') 
        ? this.twilioWhatsAppNumber 
        : `whatsapp:${this.twilioWhatsAppNumber}`;

      const twilioMessage = await this.twilioClient.messages.create({
        body: message.body,
        from: formattedFrom,
        to: formattedTo,
      });

      return {
        success: true,
        provider: 'twilio',
        messageId: twilioMessage.sid,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if WhatsApp service is configured
   */
  isConfigured(): boolean {
    const hasUltramsg = !!(this.ultramsgToken && this.ultramsgInstanceId);
    const hasTwilio = !!(this.twilioClient && this.twilioWhatsAppNumber);
    return hasUltramsg || hasTwilio;
  }

  /**
   * Get available providers
   */
  getProviders(): string[] {
    const providers: string[] = [];
    if (this.ultramsgToken && this.ultramsgInstanceId) {
      providers.push('ultramessage');
    }
    if (this.twilioClient && this.twilioWhatsAppNumber) {
      providers.push('twilio');
    }
    return providers;
  }
}

export const whatsappService = new WhatsAppService();
export default whatsappService;
