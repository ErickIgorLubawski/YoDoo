
export interface CentralDTO {
    device_id:     string;
    ipCentralMRD:  string;
    nomeEdificio:  string;
    numero:        string;
    rua:           string;
    bairro:        string;
  }

export interface CentralinfoDTO extends  CentralDTO{
    ip_local:     string;
    ip_VPN:       string;
    mac:          string;
    version:      string;
  }
  export interface CentralUpdateDTO{
    device_id:         string;
    ipCentralMRD?:  string;
    nomeEdificio?:    string;
    numero?:             string;
    rua?:                    string;
    bairro?:               string;
    ip_local?:            string;
    ip_VPN?:            string;
    mac?:                 string;
    version?:            string;
  }
// export interface CentralDetailDTO extends  CentralDTO{
//     ip_local:     string;
//     ip_VPN:       string;
//     mac:          string;
//   }


//    "ip_local": "192.168.0.129",
//    "ip_VPN": "192.168.101.4",
//    "mac": "f0:bf:97:66:89:90",
//    "createdAt": "2024-04-08T23:48:18.489Z",
//    "updatedAt": "2024-09-18T16:50:02.923Z",



//--------------------------------------------------------------------------------------

// model centrais{
//   id              String @id @default(auto()) @map("_id") @db.ObjectId
//   device_id       String @unique   
//   // Campos vindos do front + da central externa
//   ip_local      String
//   ip_VPN        String
//   mac           String
//   nomeEdificio  String
//   numero        String
//   rua           String
//   bairro        String
//   version       String
//   // Prisma vai preencher `createdAt` na inserção
//   createdAt     DateTime @default(now())
//   // Prisma vai atualizar `updatedAt` sempre que você usar `prisma.centrais.update(...)`
//   updatedAt     DateTime @updatedAt

//   @@map("teste_centrais")
// }