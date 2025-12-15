class Auth {
    static async login(email, password) {
        try {
            const data = await Api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data.user;
        } catch (error) {
            throw error;
        }
    }

    static async register(name, email, password) {
        try {
            const data = await Api.post('/auth/register', { name, email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data.user;
        } catch (error) {
            throw error;
        }
    }



    static getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    static isLoggedIn() {
        return !!localStorage.getItem('token');
    }

    static requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    static async verify() {
        if (!this.isLoggedIn()) {
            this.logout();
            return null;
        }

        try {
            const data = await Api.get('/auth/me');
            localStorage.setItem('user', JSON.stringify(data.user));
            return data.user;
        } catch (error) {
            console.error('Auth verification failed:', error);
            this.logout();
            return null;
        }
    }

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}
