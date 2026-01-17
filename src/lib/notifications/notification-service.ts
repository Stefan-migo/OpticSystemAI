import { createServiceRoleClient } from '@/utils/supabase/server';

export type NotificationType = 
  | 'order_new'
  | 'order_status_change'
  | 'low_stock'
  | 'out_of_stock'
  | 'new_customer'
  | 'new_review'
  | 'review_pending'
  | 'support_ticket_new'
  | 'support_ticket_update'
  | 'payment_received'
  | 'payment_failed'
  | 'system_alert'
  | 'system_update'
  | 'security_alert'
  | 'custom'
  | 'quote_new'
  | 'quote_status_change'
  | 'quote_converted'
  | 'work_order_new'
  | 'work_order_status_change'
  | 'work_order_completed'
  | 'appointment_new'
  | 'appointment_cancelled'
  | 'sale_new';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CreateNotificationParams {
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  targetAdminId?: string;
  targetAdminRole?: string;
}

export class NotificationService {
  /**
   * Create a notification if the notification type is enabled
   */
  static async createNotification(params: CreateNotificationParams): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createServiceRoleClient();

      // Check if notification type is enabled
      const { data: settingsData, error: settingsError } = await supabase
        .from('notification_settings')
        .select('enabled, priority')
        .eq('notification_type', params.type)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error checking notification settings:', settingsError);
        // Continue anyway - default to enabled
      }

      // If notification is disabled, skip creation
      if (settingsData && settingsData.enabled === false) {
        console.log(`Notification type ${params.type} is disabled, skipping...`);
        return { success: true }; // Return success but don't create notification
      }

      // Get priority (with override support)
      const priority = settingsData?.priority || params.priority || 'medium';

      // Create notification
      const { error: insertError } = await supabase
        .from('admin_notifications')
        .insert({
          type: params.type,
          priority: priority,
          title: params.title,
          message: params.message,
          related_entity_type: params.relatedEntityType,
          related_entity_id: params.relatedEntityId,
          action_url: params.actionUrl,
          action_label: params.actionLabel,
          metadata: params.metadata || {},
          target_admin_id: params.targetAdminId || null,
          target_admin_role: params.targetAdminRole || null,
          created_by_system: true
        });

      if (insertError) {
        console.error('Error creating notification:', insertError);
        return { success: false, error: insertError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in NotificationService.createNotification:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Create notification for new quote
   */
  static async notifyNewQuote(quoteId: string, quoteNumber: string, customerName: string, totalAmount: number): Promise<void> {
    await this.createNotification({
      type: 'quote_new',
      priority: 'high',
      title: 'Nuevo Presupuesto',
      message: `Presupuesto ${quoteNumber} creado para ${customerName} - ${this.formatCurrency(totalAmount)}`,
      relatedEntityType: 'quote',
      relatedEntityId: quoteId,
      actionUrl: `/admin/quotes/${quoteId}`,
      actionLabel: 'Ver Presupuesto',
      metadata: {
        quote_number: quoteNumber,
        customer_name: customerName,
        total_amount: totalAmount
      }
    });
  }

  /**
   * Create notification for quote status change
   */
  static async notifyQuoteStatusChange(
    quoteId: string, 
    quoteNumber: string, 
    oldStatus: string, 
    newStatus: string
  ): Promise<void> {
    const statusLabels: Record<string, string> = {
      draft: 'Borrador',
      sent: 'Enviado',
      accepted: 'Aceptado',
      rejected: 'Rechazado',
      expired: 'Expirado'
    };

    await this.createNotification({
      type: 'quote_status_change',
      priority: 'medium',
      title: 'Cambio de Estado en Presupuesto',
      message: `Presupuesto ${quoteNumber} cambió de ${statusLabels[oldStatus] || oldStatus} a ${statusLabels[newStatus] || newStatus}`,
      relatedEntityType: 'quote',
      relatedEntityId: quoteId,
      actionUrl: `/admin/quotes/${quoteId}`,
      actionLabel: 'Ver Presupuesto',
      metadata: {
        quote_number: quoteNumber,
        old_status: oldStatus,
        new_status: newStatus
      }
    });
  }

  /**
   * Create notification for quote converted to work order
   */
  static async notifyQuoteConverted(
    quoteId: string,
    quoteNumber: string,
    workOrderId: string,
    workOrderNumber: string
  ): Promise<void> {
    await this.createNotification({
      type: 'quote_converted',
      priority: 'high',
      title: 'Presupuesto Convertido a Trabajo',
      message: `Presupuesto ${quoteNumber} convertido a trabajo ${workOrderNumber}`,
      relatedEntityType: 'work_order',
      relatedEntityId: workOrderId,
      actionUrl: `/admin/work-orders/${workOrderId}`,
      actionLabel: 'Ver Trabajo',
      metadata: {
        quote_id: quoteId,
        quote_number: quoteNumber,
        work_order_id: workOrderId,
        work_order_number: workOrderNumber
      }
    });
  }

  /**
   * Create notification for new work order
   */
  static async notifyNewWorkOrder(
    workOrderId: string,
    workOrderNumber: string,
    customerName: string,
    totalAmount: number
  ): Promise<void> {
    await this.createNotification({
      type: 'work_order_new',
      priority: 'high',
      title: 'Nuevo Trabajo',
      message: `Trabajo ${workOrderNumber} creado para ${customerName} - ${this.formatCurrency(totalAmount)}`,
      relatedEntityType: 'work_order',
      relatedEntityId: workOrderId,
      actionUrl: `/admin/work-orders/${workOrderId}`,
      actionLabel: 'Ver Trabajo',
      metadata: {
        work_order_number: workOrderNumber,
        customer_name: customerName,
        total_amount: totalAmount
      }
    });
  }

  /**
   * Create notification for work order status change
   */
  static async notifyWorkOrderStatusChange(
    workOrderId: string,
    workOrderNumber: string,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    const statusLabels: Record<string, string> = {
      quote: 'Presupuesto',
      ordered: 'Ordenado',
      sent_to_lab: 'Enviado al Lab',
      in_progress_lab: 'En Lab',
      ready_at_lab: 'Listo en Lab',
      received_from_lab: 'Recibido',
      mounted: 'Montado',
      quality_check: 'Control Calidad',
      ready_for_pickup: 'Listo para Retiro',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
      returned: 'Devuelto'
    };

    await this.createNotification({
      type: 'work_order_status_change',
      priority: 'medium',
      title: 'Cambio de Estado en Trabajo',
      message: `Trabajo ${workOrderNumber} cambió de ${statusLabels[oldStatus] || oldStatus} a ${statusLabels[newStatus] || newStatus}`,
      relatedEntityType: 'work_order',
      relatedEntityId: workOrderId,
      actionUrl: `/admin/work-orders/${workOrderId}`,
      actionLabel: 'Ver Trabajo',
      metadata: {
        work_order_number: workOrderNumber,
        old_status: oldStatus,
        new_status: newStatus
      }
    });
  }

  /**
   * Create notification for work order completed
   */
  static async notifyWorkOrderCompleted(
    workOrderId: string,
    workOrderNumber: string,
    customerName: string
  ): Promise<void> {
    await this.createNotification({
      type: 'work_order_completed',
      priority: 'high',
      title: 'Trabajo Completado',
      message: `Trabajo ${workOrderNumber} para ${customerName} ha sido entregado`,
      relatedEntityType: 'work_order',
      relatedEntityId: workOrderId,
      actionUrl: `/admin/work-orders/${workOrderId}`,
      actionLabel: 'Ver Trabajo',
      metadata: {
        work_order_number: workOrderNumber,
        customer_name: customerName
      }
    });
  }

  /**
   * Create notification for new customer
   */
  static async notifyNewCustomer(customerId: string, customerName: string, email?: string): Promise<void> {
    await this.createNotification({
      type: 'new_customer',
      priority: 'medium',
      title: 'Nuevo Cliente',
      message: `Nuevo cliente registrado: ${customerName}${email ? ` (${email})` : ''}`,
      relatedEntityType: 'customer',
      relatedEntityId: customerId,
      actionUrl: `/admin/customers/${customerId}`,
      actionLabel: 'Ver Cliente',
      metadata: {
        customer_name: customerName,
        email: email
      }
    });
  }

  /**
   * Create notification for new sale
   */
  static async notifyNewSale(
    orderId: string,
    orderNumber: string,
    customerEmail: string,
    totalAmount: number
  ): Promise<void> {
    await this.createNotification({
      type: 'sale_new',
      priority: 'high',
      title: 'Nueva Venta',
      message: `Nueva venta ${orderNumber} - ${this.formatCurrency(totalAmount)}`,
      relatedEntityType: 'order',
      relatedEntityId: orderId,
      actionUrl: `/admin/orders/${orderId}`,
      actionLabel: 'Ver Pedido',
      metadata: {
        order_number: orderNumber,
        customer_email: customerEmail,
        total_amount: totalAmount
      }
    });
  }

  /**
   * Create notification for new appointment
   */
  static async notifyNewAppointment(
    appointmentId: string,
    customerName: string,
    appointmentDate: string,
    appointmentTime: string
  ): Promise<void> {
    await this.createNotification({
      type: 'appointment_new',
      priority: 'medium',
      title: 'Nueva Cita',
      message: `Nueva cita para ${customerName} el ${appointmentDate} a las ${appointmentTime}`,
      relatedEntityType: 'appointment',
      relatedEntityId: appointmentId,
      actionUrl: `/admin/appointments`,
      actionLabel: 'Ver Citas',
      metadata: {
        customer_name: customerName,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime
      }
    });
  }

  /**
   * Helper to format currency
   */
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  }
}
