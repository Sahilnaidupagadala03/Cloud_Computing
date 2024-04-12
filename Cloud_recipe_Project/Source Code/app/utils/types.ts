export type DateToString<T> = {
  [P in keyof T]: T[P] extends Date ? string : T[P]
}


export enum OrderType {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
}

export enum OrderStatus {
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  READY = 'READY',
}

export enum Role {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
}
