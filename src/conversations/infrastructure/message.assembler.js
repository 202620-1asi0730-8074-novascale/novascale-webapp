import { Message } from "../domain/model/message.entity.js";
export class MessageAssembler {
    static toEntityFromResource(resource) { return new Message({ ...resource }); }
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        return response.data.map(resource => this.toEntityFromResource(resource));
    }
}