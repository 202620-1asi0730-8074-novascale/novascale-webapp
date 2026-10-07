import { Activity } from "../domain/model/activity.entity.js";
export class ActivityAssembler {
    static toEntityFromResource(resource) { return new Activity({ ...resource }); }
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        return response.data.map(resource => this.toEntityFromResource(resource));
    }
}