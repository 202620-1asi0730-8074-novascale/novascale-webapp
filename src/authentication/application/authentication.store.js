import { ref, reactive } from "vue";
import { AuthenticationApi } from "../infrastructure/authentication-api.js";
import { UserAssembler } from "../infrastructure/user.assembler.js";

const authApi = new AuthenticationApi();

const store = (() => {
    const users = ref([]);
    const profile = ref(null);
    const sessionKey = 'novaleads.demoUserId';

    function fetchUsers() {
        return authApi.getUsers().then(response => {
            users.value = UserAssembler.toEntitiesFromResponse(response);
            return users.value;
        });
    }

    function setSession({ user }) {
        profile.value = user;
        sessionStorage.setItem(sessionKey, String(user.id));
        sessionStorage.setItem('novaleads.userId', String(user.id));
    }

    async function fetchProfile() {
        if (!sessionStorage.getItem(sessionKey)) { profile.value = null; return null; }
        try {
            const response = await authApi.getProfile();
            profile.value = response.data;
            return profile.value;
        } catch (error) {
            signOut();
            throw error;
        }
    }

    async function signIn(email, password) {
        const response = await authApi.login(email.trim().toLowerCase(), password);
        setSession(response.data);
        return response.data.user;
    }

    async function signUp({ name, company, email, password }) {
        const created = await authApi.register({ name: name.trim(), company: company.trim(), email: email.trim().toLowerCase(), password });
        setSession(created.data);
        users.value.push(UserAssembler.toEntityFromResource(created.data.user));
        return created.data.user;
    }

    async function updateProfile(changes) {
        if (!profile.value?.id) throw new Error('No hay una sesión activa.');
        const response = await authApi.updateUser(profile.value.id, changes);
        profile.value = response.data;
        const index = users.value.findIndex(user => user.id === profile.value.id);
        if (index !== -1) users.value[index] = UserAssembler.toEntityFromResource(profile.value);
        return profile.value;
    }

    async function changePassword(currentPassword, newPassword) {
        return authApi.changePassword(currentPassword, newPassword);
    }

    function signOut() {
        if (sessionStorage.getItem(sessionKey)) authApi.logout().catch(() => {});
        profile.value = null;
        sessionStorage.removeItem(sessionKey);
        sessionStorage.removeItem('novaleads.userId');
    }

    return reactive({ users, profile, fetchUsers, fetchProfile, signIn, signUp, updateProfile, changePassword, signOut });
})();

export function useAuthenticationStore() { return store; }
