// export interface CadastroUsuarioBody {
//     name: string;
//     idYD: string;
//     begin_time: string;
//     end_time: string;
//     acessos: string[];
//     password: string;
//   }
  
//   export interface BiometriaBody {
//     idYD: string;
//     acessos: string[];
//     base64: string;
//   }
  
//   export interface DeleteBody {
//     idYD: string;
//     acessos: string[];
//   }
  
  export type MetodoHttp = "POST" | "PUT" | "DELETE" | "GET";
  
  export interface Payload<BodyType> {
    endpoint: string;
    method: MetodoHttp;
    body?: BodyType;
  }
  
//   export interface ServiceResult {
//     success: boolean;
//     endpoint: string;
//     status?: number;
//     error?: string;
//     user_idDevice?: number;
//     rawResponse?: any;
//   }
  
//   export interface ProcessResult {
//     task: "SUCCESS" | "ERROR";
//     details: ServiceResult[];
//   }

//   // src/types/CentralResponse.ts

// export type CentralResponse = {
//   success: boolean;
//   user_idDevice?: number;
//   messages: string[];
// };
