import { UsuarioDTO } from "../DTOs/UsuarioDTO";
import { EquipamentoServices }    from "../services/EquipamentoServices";


export class RequestCentral {
    static buscaIp: any;

    async buscaIp(ipequipamento: UsuarioDTO){
        const service = new EquipamentoServices();
        
        const equipmentos = await service.getIpsByDeviceIds(ipequipamento.acessos);
        //const equipmentos = '192.168.0.129'

        const usuariocentral = {
            name: ipequipamento.name,
            idYD: ipequipamento.idYD,
            begin_time: ipequipamento.begin_time,
            end_time: ipequipamento.end_time,
            acessos: [equipmentos],
            password: ipequipamento.password,
        };
            console.log(usuariocentral)
            const url = `http://mrdprototype.ddns.net:557/cadastro_cl`;
            const response = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(usuariocentral),
            });
            if(!response){
                console.log(response,'falha')
            }
            console.log(response,'SUCESS')
    }
}
