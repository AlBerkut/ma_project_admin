<template>
    <base-page-layout>
        <template slot="pageTitle">
            {{ translateText('login') }}
        </template>

        <div class="auth-form" :key="$route.name">
            <form class="form-signin" @submit.prevent="auth">
                <div class="form-label-group">
                    <label for="inputEmail">{{ translateText('email') }}</label>

                    <input
                        type="text"
                        id="inputEmail"
                        class="form-control"
                        :placeholder="translateText('email')"
                        v-model="userEmail"
                        autofocus
                    />
                </div>

                <div class="form-label-group">
                    <label for="inputPassword">{{ translateText('password') }}</label>

                    <input
                        type="password"
                        id="inputPassword"
                        class="form-control"
                        :placeholder="translateText('password')"
                        v-model="userPassword"
                    />

                    <small id="emailHelp" class="form-text text-muted">{{
                        translateText('passwordHint')
                    }}</small>
                </div>

                <div class="form-auth-buttons">
                    <button class="btn btn-primary btn-block" type="submit">
                        {{ translateText('logIn') }}
                    </button>

                    <button class="btn btn-primary js-login-with-google" type="button">
                        <font-awesome-icon :icon="['fab', 'google']" />
                    </button>

                    <button class="btn btn-primary" type="button" @click="loginWithFB">
                        <font-awesome-icon :icon="['fab', 'facebook-f']" />
                    </button>
                </div>
            </form>
        </div>
    </base-page-layout>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

import GoogleAuthService from '@/service/GoogleAuthService';
import FacebookAuthService from '@/service/FacebookAuthService';
import BasePageLayout from '@/views/BasePageLayout.vue';

import eventBus from '@/eventBus';
import { namespace } from 'vuex-class';
import { UserPublicData } from '@/index.d';

const authModule = namespace('auth');
const userModule = namespace('user');

@Component({
    name: 'AuthPage',
    components: {
        BasePageLayout,
    },
})
export default class AuthPage extends Vue {
    userEmail = '';

    userPassword = '';

    @authModule.Action('login') login!: Function;

    @authModule.Action('loginWithGoogle') loginWithGoogle!: Function;

    @authModule.Action('loginWithFacebook') loginWithFacebook!: Function;

    @authModule.Mutation('SET_TOKEN') setToken!: Function;

    @userModule.Action('loadUser') loadUser!: Function;

    @userModule.State('user') user!: UserPublicData;

    mounted() {
        this.initGoogleAuth();
    }

    async auth() {
        try {
            const requestData = {
                email: this.userEmail,
                password: this.userPassword,
            };

            const response = await this.login(requestData);
            const { tokenData } = response.data;

            if (tokenData) {
                this.setToken(tokenData);
                await this.loadUser();

                if (this.user.isAdmin) {
                    this.$router.replace({ name: 'home' });
                } else {
                    eventBus.$emit('notify-error', this.translateText('accessForbidden'));
                }
            } else {
                eventBus.$emit('notify-error', this.translateText('accessForbidden'));
            }
        } catch (error) {
            eventBus.$emit('notify-error', error.response.data.error);
        }
    }

    async initGoogleAuth() {
        const instance: any = await GoogleAuthService.getInstance();

        instance.attachClickHandler(
            document.querySelector('.js-login-with-google'),
            {},
            async (googleUser: any) => {
                const idToken = googleUser.getAuthResponse().id_token;

                try {
                    await this.loginWithGoogle(idToken);
                    await this.loadUser();

                    if (this.user.isAdmin) {
                        this.$router.replace({ name: 'home' });
                    } else {
                        eventBus.$emit('notify-error', this.translateText('accessForbidden'));
                    }
                } catch (error) {
                    eventBus.$emit('notify-error', error.response.data.error);
                }
            },
            (error: any) => {
                eventBus.$emit('notify-error', error.message);
            },
        );
    }

    async loginWithFB() {
        const instance: any = FacebookAuthService.getInstance();

        instance.login(async (response: any) => {
            const { accessToken, userID: userId } = response.authResponse;

            try {
                await this.loginWithFacebook({
                    accessToken,
                    userId,
                });

                await this.loadUser();

                if (this.user.isAdmin) {
                    this.$router.replace({ name: 'home' });
                } else {
                    eventBus.$emit('notify-error', this.translateText('accessForbidden'));
                }
            } catch (error) {
                eventBus.$emit('notify-error', error.response.data.error);
            }
        });
    }
}
</script>

<style scoped lang="scss">
.auth-form {
    display: flex;
    align-items: center;
    height: 100%;

    &__register-link {
        margin-top: 12px;
    }
}

.form-signin {
    width: 100%;
    max-width: 420px;
    padding: 15px;
    margin: auto;
}

.form-label-group {
    position: relative;
    margin-bottom: 1rem;
}

.form-label-group > label {
    font-weight: bold;
}

.form-auth-buttons {
    display: flex;

    .btn {
        margin-right: 9px;
        min-width: 50px;
    }

    .btn:last-child {
        margin-right: 0;
    }
}
</style>
