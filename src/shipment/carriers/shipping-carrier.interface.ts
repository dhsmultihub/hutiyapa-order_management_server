export interface ShippingCarrierResponse {
    success: boolean;
    trackingNumber?: string;
    carrierResponse?: any;
    error?: string;
    trackingUrl?: string;
    estimatedDelivery?: Date;
}

export interface ShipmentRequest {
    orderId: string;
    orderNumber: string;
    recipientName: string;
    recipientPhone: string;
    recipientEmail: string;
    shippingAddress: {
        address1: string;
        address2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    packageDetails: {
        weight: number; // in kg
        dimensions: {
            length: number; // in cm
            width: number; // in cm
            height: number; // in cm
        };
        description: string;
        value: number; // in INR
    };
    serviceType: string;
    specialInstructions?: string;
}

export interface TrackingUpdate {
    trackingNumber: string;
    status: string;
    location?: string;
    timestamp: Date;
    description: string;
    carrierResponse?: any;
}

export interface ShippingCarrier {
    createShipment(request: ShipmentRequest): Promise<ShippingCarrierResponse>;
    trackShipment(trackingNumber: string): Promise<ShippingCarrierResponse>;
    cancelShipment(trackingNumber: string): Promise<ShippingCarrierResponse>;
    getShippingRates(request: ShipmentRequest): Promise<ShippingCarrierResponse>;
}
