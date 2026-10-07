import { Contact } from "../domain/model/contact.entity.js";
export class ContactAssembler {
    static toEntityFromResource(resource) { return new Contact({ ...resource }); }
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        return response.data.map(resource => this.toEntityFromResource(resource));
    }
}