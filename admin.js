class AdminManager {
    constructor() {
        this.db = new Database();
        this.init();
    }
    
    init() {
        if (!this.db.isAdminLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }
        
        this.loadInscriptions();
        this.setupEventListeners();
        this.setupTabs();
    }
    
    setupTabs() {
        const tabs = document.querySelectorAll('.admin-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const statut = tab.getAttribute('data-statut');
                this.loadInscriptions('', '', statut);
            });
        });
    }
    
    loadInscriptions(category = '', search = '', statut = '') {
        const inscriptions = this.db.filterInscriptions(category, search, statut);
        const tableBody = document.getElementById('registrations-table');
        const noDataMessage = document.getElementById('no-data-message');
        
        this.updateStats();
        
        if (inscriptions.length === 0) {
            tableBody.innerHTML = '';
            noDataMessage.style.display = 'block';
            return;
        }
        
        noDataMessage.style.display = 'none';
        
        tableBody.innerHTML = inscriptions.map(inscription => `
            <tr>
                <td>${inscription.id}</td>
                <td>${inscription.nom}</td>
                <td>${inscription.age}</td>
                <td>${inscription.contact}</td>
                <td>
                    <span class="type-badge ${inscription.type_inscription}">
                        ${inscription.type_inscription === 'participant' ? '🎵 Participant' : '👀 Assistant'}
                    </span>
                </td>
                <td>
                    ${inscription.categorie ? `
                        <span class="category-badge ${inscription.categorie}">
                            ${this.getCategoryIcon(inscription.categorie)} ${inscription.categorie}
                        </span>
                    ` : '-'}
                </td>
                <td>${inscription.montant} FCFA</td>
                <td>
                    <span class="statut-badge ${inscription.statut}">
                        ${inscription.statut === 'confirmé' ? '✅ Confirmé' : '⏳ En attente'}
                    </span>
                </td>
                <td>${inscription.date_inscription}</td>
                <td>
                    ${inscription.statut === 'en_attente' ? `
                        <button class="action-btn btn-confirm" onclick="adminManager.confirmerInscription(${inscription.id})">
                            <i class="fas fa-check"></i> Confirmer
                        </button>
                    ` : `
                        <span class="confirmed-by">Par: ${inscription.confirme_par}</span>
                    `}
                    <button class="action-btn btn-delete" onclick="adminManager.deleteInscription(${inscription.id})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    getCategoryIcon(category) {
        const icons = {
            'chant': '🎵',
            'danse': '💃', 
            'imitation': '🎭'
        };
        return icons[category] || '❓';
    }
    
    updateStats() {
        const inscriptions = this.db.getInscriptions();
        const enAttente = this.db.getInscriptionsByStatut('en_attente');
        const confirmes = this.db.getInscriptionsByStatut('confirmé');
        
        document.getElementById('total-inscriptions').textContent = inscriptions.length;
        document.getElementById('en-attente-count').textContent = enAttente.length;
        document.getElementById('confirmes-count').textContent = confirmes.length;
        
        const revenusTotal = inscriptions.reduce((sum, ins) => sum + ins.montant, 0);
        const revenusConfirmes = confirmes.reduce((sum, ins) => sum + ins.montant, 0);
        
        document.getElementById('revenus-total').textContent = revenusTotal.toLocaleString() + ' FCFA';
        document.getElementById('revenus-confirmes').textContent = revenusConfirmes.toLocaleString() + ' FCFA';
    }
    
    confirmerInscription(id) {
        const session = this.db.getAdminSession();
        if (!session) return;
        
        if (confirm('Confirmer cette inscription ?')) {
            const success = this.db.confirmerInscription(id, session.name);
            if (success) {
                this.loadInscriptions();
                alert('Inscription confirmée avec succès');
            }
        }
    }
    
    deleteInscription(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette inscription ?')) {
            this.db.deleteInscription(id);
            this.loadInscriptions();
            alert('Inscription supprimée avec succès');
        }
    }
    
    setupEventListeners() {
        document.getElementById('filter-category').addEventListener('change', (e) => {
            this.loadInscriptions(
                e.target.value,
                document.getElementById('search-name').value,
                document.querySelector('.admin-tab.active').getAttribute('data-statut')
            );
        });
        
        document.getElementById('search-name').addEventListener('input', (e) => {
            this.loadInscriptions(
                document.getElementById('filter-category').value,
                e.target.value,
                document.querySelector('.admin-tab.active').getAttribute('data-statut')
            );
        });
        
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadInscriptions();
            alert('Données actualisées');
        });
        
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                this.db.clearAdminSession();
                window.location.href = 'login.html';
            }
        });
    }
}

const adminManager = new AdminManager();