// Theme Manager
class ThemeManager {
    constructor() {
        this.theme = 'light';
    }
    
    init() {
        const saved = localStorage.getItem('theme');
        if (saved) {
            this.theme = saved;
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.theme = 'dark';
        }
        this.apply();
    }
    
    apply() {
        document.documentElement.setAttribute('data-theme', this.theme);
    }
    
    toggle() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.apply();
    }
}

const themeManager = new ThemeManager();

