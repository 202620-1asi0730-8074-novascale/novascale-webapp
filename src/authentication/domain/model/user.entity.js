export class User {
    constructor({ id = null, name = '', email = '', role = '', company = '', id_role = null, permissions = {}, phone = '', quota = 0, status = 'ACTIVE', organizationId = null, isOwner = false, canExportData = false, canDeleteLeads = false }) {
        this.id = id; this.name = name; this.email = email; this.role = role; this.company = company; this.id_role = id_role; this.permissions = permissions;
        this.phone = phone; this.quota = quota; this.status = status; this.organizationId = organizationId; this.isOwner = isOwner;
        this.canExportData = canExportData; this.canDeleteLeads = canDeleteLeads;
    }
}
