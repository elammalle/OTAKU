// Gestion de l'espace administrateur
class AdminManager {
    constructor() {
        this.db = new Database();
        this.init();
    }
    
    init() {
        // Vérifier la session
        if (!this.db.isAdminLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }
        
        // Charger les données
        this.loadInscriptions();
        this.setupEventListeners();
        this.displayAdminInfo();
        this.setupTabs();
    }
    
    setupTabs() {
        const tabs = document.querySelectorAll('.admin-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Retirer la classe active de tous les tabs
                tabs.forEach(t => t.classList.remove('active'));
                // Ajouter la classe active au tab cliqué
                tab.classList.add('active');
                
                // Charger les données selon le tab
                const statut = tab.getAttribute('data-statut');
                this.loadInscriptions('', '', statut);
            });
        });
    }
    
    displayAdminInfo() {
        const session = this.db.getAdminSession();
        if (session) {
            console.log(`Connecté en tant que: ${session.name} (${session.email})`);
        }
    }
    
    loadInscriptions(category = '', search = '', statut = '') {
        const inscriptions = this.db.filterInscriptions(category, search, statut);
        const tableBody = document.getElementById('registrations-table');
        const noDataMessage = document.getElementById('no-data-message');
        
        // Mise à jour des statistiques
        this.updateStats();
        
        // Affichage du message si aucune donnée
        if (inscriptions.length === 0) {
            tableBody.innerHTML = '';
            noDataMessage.style.display = 'block';
            return;
        }
        
        noDataMessage.style.display = 'none';
        
        // Remplissage du tableau
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
        
        // Calcul des revenus
        const revenusTotal = inscriptions.reduce((sum, ins) => sum + ins.montant, 0);
        const revenusConfirmes = confirmes.reduce((sum, ins) => sum + ins.montant, 0);
        
        document.getElementById('revenus-total').textContent = revenusTotal.toLocaleString() + ' FCFA';
        document.getElementById('revenus-confirmes').textContent = revenusConfirmes.toLocaleString() + ' FCFA';
    }
    
    confirmerInscription(id) {
        const session = this.db.getAdminSession();
        if (!session) return;
        
        if (confirm('Confirmer cette inscription ? Le participant sera notifié.')) {
            const success = this.db.confirmerInscription(id, session.name);
            if (success) {
                this.loadInscriptions(
                    document.getElementById('filter-category').value,
                    document.getElementById('search-name').value,
                    document.querySelector('.admin-tab.active').getAttribute('data-statut')
                );
                this.showNotification('Inscription confirmée avec succès', 'success');
            }
        }
    }
    
    deleteInscription(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette inscription ? Cette action est irréversible.')) {
            this.db.deleteInscription(id);
            this.loadInscriptions(
                document.getElementById('filter-category').value,
                document.getElementById('search-name').value,
                document.querySelector('.admin-tab.active').getAttribute('data-statut')
            );
            this.showNotification('Inscription supprimée avec succès', 'success');
        }
    }
    
    exportToCSV() {
        const inscriptions = this.db.getInscriptions();
        
        if (inscriptions.length === 0) {
            this.showNotification('Aucune donnée à exporter.', 'error');
            return;
        }
        
        // En-têtes CSV
        const headers = ['ID', 'Nom', 'Âge', 'Contact', 'Type', 'Catégorie', 'Montant', 'Statut', 'Date Inscription', 'Date Confirmation', 'Confirmé par'];
        
        // Données
        const csvData = inscriptions.map(inscription => [
            inscription.id,
            `"${inscription.nom}"`,
            inscription.age,
            `"${inscription.contact}"`,
            inscription.type_inscription,
            inscription.categorie || '',
            inscription.montant,
            inscription.statut,
            inscription.date_inscription,
            inscription.date_confirmation || '',
            inscription.confirme_par || ''
        ]);
        
        // Construction du CSV
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');
        
        // Création et téléchargement du fichier
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `inscriptions_otaku_concert_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Export CSV réussi!', 'success');
    }
    
    setupEventListeners() {
        // Filtrage des inscriptions
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
        
        // Bouton d'actualisation
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadInscriptions(
                document.getElementById('filter-category').value,
                document.getElementById('search-name').value,
                document.querySelector('.admin-tab.active').getAttribute('data-statut')
            );
            this.showNotification('Données actualisées', 'info');
        });
        
        // Export des données
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportToCSV();
        });
        
        // Déconnexion
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                this.db.clearAdminSession();
                window.location.href = 'login.html';
            }
        });
    }
    
    showNotification(message, type = 'info') {
        // Création de la notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Styles de notification
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // Suppression automatique après 3 secondes
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'info': 'info-circle',
            'warning': 'exclamation-triangle'
        };
        return icons[type] || 'info-circle';
    }
    
    getNotificationColor(type) {
        const colors = {
            'success': '#4CAF50',
            'error': '#F44336',
            'info': '#2196F3',
            'warning': '#FF9800'
        };
        return colors[type] || '#2196F3';
    }
}

// Styles CSS supplémentaires
const adminStyles = document.createElement('style');
adminStyles.textContent = `
    .admin-tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 2rem;
        border-bottom: 2px solid rgba(255,255,255,0.1);
    }
    
    .admin-tab {
        padding: 12px 25px;
        background: rgba(255,255,255,0.05);
        border: none;
        border-radius: 10px 10px 0 0;
        color: #ccc;
        cursor: pointer;
        transition: all 0.3s;
        font-weight: 600;
    }
    
    .admin-tab.active {
        background: var(--neon-pink);
        color: white;
    }
    
    .admin-tab:hover:not(.active) {
        background: rgba(255,255,255,0.1);
    }
    
    .type-badge {
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .type-badge.participant {
        background: rgba(255, 64, 129, 0.2);
        color: var(--neon-pink);
        border: 1px solid var(--neon-pink);
    }
    
    .type-badge.assistant {
        background: rgba(0, 188, 212, 0.2);
        color: var(--neon-blue);
        border: 1px solid var(--neon-blue);
    }
    
    .statut-badge {
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .statut-badge.confirmé {
        background: rgba(76, 175, 80, 0.2);
        color: #4CAF50;
        border: 1px solid #4CAF50;
    }
    
    .statut-badge.en_attente {
        background: rgba(255, 152, 0, 0.2);
        color: #FF9800;
        border: 1px solid #FF9800;
    }
    
    .btn-confirm {
        background: #4CAF50;
        color: white;
    }
    
    .btn-confirm:hover {
        background: #45a049;
    }
    
    .confirmed-by {
        font-size: 0.8rem;
        color: #4CAF50;
        font-style: italic;
    }
    
    .tarifs-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 2rem;
    }
    
    .tarif-card {
        background: rgba(255,255,255,0.05);
        padding: 1.5rem;
        border-radius: 10px;
        text-align: center;
        border: 2px solid transparent;
        transition: all 0.3s;
    }
    
    .tarif-card:hover {
        border-color: var(--neon-pink);
        transform: translateY(-5px);
    }
    
    .tarif-card h3 {
        color: var(--neon-blue);
        margin-bottom: 1rem;
    }
    
    .prix {
        font-size: 2rem;
        font-weight: bold;
        color: var(--neon-pink);
        margin-bottom: 1rem;
    }
    
    .payment-info {
        background: rgba(255,255,255,0.05);
        padding: 1.5rem;
        border-radius: 10px;
        margin: 2rem 0;
        border-left: 4px solid var(--neon-blue);
    }
    
    .payment-steps {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 20px;
        margin-top: 1rem;
    }
    
    .step {
        text-align: center;
        padding: 1rem;
    }
    
    .step-number {
        display: inline-block;
        width: 30px;
        height: 30px;
        background: var(--neon-pink);
        color: white;
        border-radius: 50%;
        line-height: 30px;
        margin-bottom: 1rem;
        font-weight: bold;
    }
    
    .numero-paiement, .montant, .reference {
        font-weight: bold;
        color: var(--neon-blue);
        font-size: 1.1rem;
        margin-top: 0.5rem;
    }
    
    .verification-result {
        background: rgba(255,255,255,0.05);
        padding: 2rem;
        border-radius: 15px;
        margin-top: 2rem;
        text-align: center;
        border-left: 4px solid;
    }
    
    .verification-result.success {
        border-left-color: #4CAF50;
    }
    
    .verification-result.error {
        border-left-color: #F44336;
    }
    
    .verification-result.warning {
        border-left-color: #FF9800;
    }
    
    .result-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
    }
    
    .verification-result.success .result-icon {
        color: #4CAF50;
    }
    
    .verification-result.error .result-icon {
        color: #F44336;
    }
    
    .verification-result.warning .result-icon {
        color: #FF9800;
    }
    
    .inscription-details {
        text-align: left;
        background: rgba(255,255,255,0.05);
        padding: 1.5rem;
        border-radius: 10px;
        margin: 1.5rem 0;
    }
    
    .statut-confirme {
        color: #4CAF50;
        font-weight: bold;
    }
    
    .statut-attente {
        color: #FF9800;
        font-weight: bold;
    }
    
    .success-message {
        color: #4CAF50;
        font-size: 1.1rem;
    }
    
    .warning-message {
        color: #FF9800;
        font-size: 1.1rem;
    }
    
    @media (max-width: 768px) {
        .tarifs-info, .payment-steps {
            grid-template-columns: 1fr;
        }
        
        .admin-tabs {
            flex-wrap: wrap;
        }
    }
`;
document.head.appendChild(adminStyles);

// Initialisation de l'admin manager
const adminManager = new AdminManager();