export type MetodoHttp = "POST" | "PUT" | "DELETE" | "GET";
  
  export interface Payload<BodyType> {
    endpoint: string;
    method:   MetodoHttp;
    body?:    BodyType;
  }
