import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './styles/main.css';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './store/auth';
import { ws } from './services/ws';
import { useLabsStore } from './store/labs';
import { WsEvent } from '@shared/payloads/ws';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
const auth = useAuthStore();
const labs = useLabsStore();

ws.addListener(WsEvent.HELLO, ({ labs: labStates }) => labs.setInitial(labStates));
ws.addListener(WsEvent.REQUEST_CREATED, (d) => labs.addRequest(d.request.lab_id, d));
ws.addListener(WsEvent.REQUEST_UPDATED, (d) => labs.updateRequest(d.request.lab_id, d));
ws.addListener(WsEvent.REQUEST_DELETED, (d) => labs.removeRequest(d.labId, d.requestId));
ws.addListener(WsEvent.TAG_CREATED, ({ tag }) => labs.addTag(tag.lab_id, tag));
ws.addListener(WsEvent.TAG_UPDATED, ({ tag }) => labs.updateTag(tag.lab_id, tag));
ws.addListener(WsEvent.TAG_DELETED, ({ labId, tagId }) => labs.removeTag(labId, tagId));
ws.addListener(WsEvent.MEMBER_JOINED, (d) => labs.addMember(d.labId, d));
ws.addListener(WsEvent.MEMBER_LEFT, (d) => labs.handleMemberLeft(d.labId, d.userId));
ws.addListener(WsEvent.LAB_UPDATED, (d) => labs.updateLab(d.lab));
ws.addListener(WsEvent.INVITE_CREATED, (d) => labs.addInvite(d.invite.lab_id, d.invite));
ws.addListener(WsEvent.INVITE_UPDATED, (d) => labs.updateInvite(d.invite.lab_id, d.invite));
ws.addListener(WsEvent.INVITE_DELETED, (d) => labs.removeInvite(d.labId, d.inviteId));
ws.addListener(WsEvent.ROLE_CREATED, ({ role }) => labs.addRole(role.lab_id, role));
ws.addListener(WsEvent.ROLE_UPDATED, ({ role }) => labs.updateRole(role.lab_id, role));
ws.addListener(WsEvent.ROLE_DELETED, (d) => labs.removeRole(d.labId, d.roleId));
ws.addListener(WsEvent.LAB_CREATED, ({ lab }) => labs.addLab(lab));
ws.addListener(WsEvent.LAB_UPDATED, ({ lab }) => labs.updateLab(lab));
ws.addListener(WsEvent.LAB_DELETED, ({ labId }) => labs.removeLab(labId));
ws.addListener(WsEvent.USER_UPDATED, ({ user }) => {
    labs.updateUser(user);
    if (auth.user && auth.user.id === user.id) {
        auth.user = user;
        localStorage.setItem('user', JSON.stringify(user));
    }
});
ws.addListener(WsEvent.CHANNEL_CREATED, ({ channel }) => {
    if (channel.lab_id != null) {
        labs.addChannel(channel.lab_id, channel);
    }
});
ws.addListener(WsEvent.CHANNEL_UPDATED, ({ channel }) => {
    if (channel.lab_id != null) {
        labs.updateChannel(channel.lab_id, channel);
    }
});
ws.addListener(WsEvent.CHANNEL_DELETED, ({ labId, channelId }) =>
    labs.removeChannel(labId, channelId),
);
ws.addListener(WsEvent.MESSAGE_CREATED, ({ message }) =>
    labs.addMessage(message.channel_id, message),
);
ws.addListener(WsEvent.MESSAGE_UPDATED, ({ message }) =>
    labs.updateMessage(message.channel_id, message),
);
ws.addListener(WsEvent.MESSAGE_DELETED, ({ channelId, messageId }) =>
    labs.removeMessage(channelId, messageId),
);

if (auth.apiKey) {
    ws.connect(auth.apiKey);
}
app.use(router).mount('#app');
