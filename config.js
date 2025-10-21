// config.js - Configuration globale
const CONFIG = {
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/VOTRE_ID_DEPLOIEMENT/exec',
    ADMIN_PHONE: '+223 71 36 40 70',
    TARIFS: {
        participant: 2000,
        assistant: 1500
    }
};

// Gestion de la base de données Google Sheets
class GoogleSheetsDB {
    constructor() {
        this.scriptUrl = CONFIG.GOOGLE_SCRIPT_URL;
        this.localStorageKey = 'otaku_inscriptions_backup';
    }
    
    // Sauvegarder une inscription
    async addInscription(inscription) {
        try {
            console.log('Envoi vers Google Sheets...', inscription);
            
            const response = await fetch(this.scriptUrl, {
                method: 'POST',
                body: JSON.stringify(inscription)
            });
            
            const result = await response.json();
            
            // Sauvegarder localement aussi en backup
            this.saveToLocalStorage(inscription);
            
            return result;
            
        } catch (error) {
            console.error('Erreur Google Sheets, utilisation du backup local:', error);
            return this.saveToLocalStorage(inscription);
        }
    }
    
    // Récupérer toutes les inscriptions
    async getInscriptions() {
        try {
            const response = await fetch(this.scriptUrl);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erreur de récupération, utilisation du backup local:', error);
            return this.getFromLocalStorage();
        }
    }
    
    // Méthodes de backup local
    saveToLocalStorage(inscription) {
        const inscriptions = this.getFromLocalStorage();
        const newId = inscriptions.length > 0 ? Math.max(...inscriptions.map(i => i.id)) + 1 : 1;
        
        const newInscription = {
            id: newId,
            ...inscription,
            date_inscription: new Date().toISOString().split('T')[0],
            statut: 'en_attente',
            confirme_par: '',
            date_confirmation: ''
        };
        
        inscriptions.push(newInscription);
        localStorage.setItem(this.localStorageKey, JSON.stringify(inscriptions));
        
        return {
            status: 'success',
            id: newId,
            message: 'Inscription sauvegardée localement (backup)'
        };
    }
    
    getFromLocalStorage() {
        return JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
    }
    
    // Vérifier une inscription par téléphone
    async getInscriptionByPhone(phone) {
        const inscriptions = await this.getInscriptions();
        return inscriptions.find(ins => ins.contact === phone);
    }
    
    // Confirmer une inscription (pour l'admin)
    async confirmerInscription(id, adminName) {
        try {
            const response = await fetch(this.scriptUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'confirm',
                    id: id,
                    adminName: adminName
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur confirmation:', error);
            // Fallback local
            return this.confirmLocal(id, adminName);
        }
    }
    
    confirmLocal(id, adminName) {
        const inscriptions = this.getFromLocalStorage();
        const inscription = inscriptions.find(ins => ins.id == id);
        
        if (inscription) {
            inscription.statut = 'confirmé';
            inscription.confirme_par = adminName;
            inscription.date_confirmation = new Date().toISOString().split('T')[0];
            localStorage.setItem(this.localStorageKey, JSON.stringify(inscriptions));
            return { status: 'success', message: 'Inscription confirmée localement' };
        }
        return { status: 'error', message: 'Inscription non trouvée' };
    }
    
    // Gestion de session admin
    setAdminSession(adminData) {
        const session = {
            ...adminData,
            loginTime: new Date().getTime(),
            expires: new Date().getTime() + 3600000
        };
        localStorage.setItem('admin_session', JSON.stringify(session));
    }
    
    getAdminSession() {
        const session = localStorage.getItem('admin_session');
        if (!session) return null;
        
        const sessionData = JSON.parse(session);
        const now = new Date().getTime();
        
        if (now > sessionData.expires) {
            this.clearAdminSession();
            return null;
        }
        
        return sessionData;
    }
    
    clearAdminSession() {
        localStorage.removeItem('admin_session');
    }
    
    isAdminLoggedIn() {
        return this.getAdminSession() !== null;
    }
}

// Initialisation de la base de données
const db = new GoogleSheetsDB();

// Gestion du formulaire d'inscription
if (document.getElementById('registration-form')) {
    const typeInscription = document.getElementById('type_inscription');
    const categorieGroup = document.getElementById('categorie-group');
    const videoGroup = document.getElementById('video-group');
    const montantAPayer = document.getElementById('montant-a-payer');
    const referencePaiement = document.getElementById('reference-paiement');
    
    // Gestion du changement de type d'inscription
    typeInscription.addEventListener('change', function() {
        const type = this.value;
        
        if (type === 'participant') {
            categorieGroup.style.display = 'block';
            videoGroup.style.display = 'block';
            montantAPayer.textContent = '2 000 FCFA';
            if (document.getElementById('categorie')) document.getElementById('categorie').required = true;
            if (document.getElementById('video')) document.getElementById('video').required = true;
        } else if (type === 'assistant') {
            categorieGroup.style.display = 'none';
            videoGroup.style.display = 'none';
            montantAPayer.textContent = '1 500 FCFA';
            if (document.getElementById('categorie')) document.getElementById('categorie').required = false;
            if (document.getElementById('video')) document.getElementById('video').required = false;
        } else {
            categorieGroup.style.display = 'none';
            videoGroup.style.display = 'none';
            montantAPayer.textContent = '-';
        }
        
        // Mettre à jour la référence avec le nom
        const nom = document.getElementById('nom').value;
        if (nom) {
            referencePaiement.textContent = nom.substring(0, 10);
        }
    });
    
    // Mettre à jour la référence quand le nom change
    document.getElementById('nom').addEventListener('input', function() {
        if (this.value) {
            referencePaiement.textContent = this.value.substring(0, 10);
        }
    });
    
    document.getElementById('registration-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            // Désactiver le bouton
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
            
            // Validation des champs
            const type = document.getElementById('type_inscription').value;
            const nom = document.getElementById('nom').value.trim();
            const age = parseInt(document.getElementById('age').value);
            const contact = document.getElementById('contact').value.trim();
            const codeTransaction = document.getElementById('code_transaction').value.trim();
            
            if (!type || !nom || !age || !contact || !codeTransaction) {
                throw new Error('Veuillez remplir tous les champs obligatoires.');
            }
            
            if (age < 12 || age > 60) {
                throw new Error('L\'âge doit être compris entre 12 et 60 ans.');
            }
            
            // Validation spécifique pour les participants
            let categorie = '';
            let video = '';
            let montant = 0;
            
            if (type === 'participant') {
                categorie = document.getElementById('categorie').value;
                video = document.getElementById('video').value.trim();
                montant = 2000;
                
                if (!categorie || !video) {
                    throw new Error('Pour les participants, la catégorie et le lien vidéo sont obligatoires.');
                }
            } else {
                montant = 1500;
            }
            
            // Récupération des données du formulaire
            const formData = {
                type_inscription: type,
                nom: nom,
                age: age,
                contact: contact,
                categorie: categorie,
                video: video,
                code_transaction: codeTransaction,
                montant: montant
            };
            
            // Ajout à la base de données
            const result = await db.addInscription(formData);
            
            if (result.status === 'success') {
                // Redirection vers la page de confirmation
                window.location.href = 'confirmation.html';
            } else {
                throw new Error(result.message);
            }
            
        } catch (error) {
            alert('Erreur: ' + error.message);
        } finally {
            // Réactiver le bouton
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

// Gestion de la vérification d'inscription
if (document.getElementById('verification-form')) {
    document.getElementById('verification-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const phone = document.getElementById('phone_verification').value.trim();
        const resultDiv = document.getElementById('verification-result');
        
        if (!phone) {
            alert('Veuillez entrer votre numéro de téléphone.');
            return;
        }
        
        try {
            const inscription = await db.getInscriptionByPhone(phone);
            
            if (!inscription) {
                resultDiv.innerHTML = `
                    <div class="verification-result error">
                        <div class="result-icon">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <h3>Aucune inscription trouvée</h3>
                        <p>Aucune inscription n'a été trouvée avec ce numéro de téléphone.</p>
                        <a href="inscription.html" class="btn btn-primary">S'inscrire maintenant</a>
                    </div>
                `;
            } else {
                if (inscription.statut === 'confirmé') {
                    resultDiv.innerHTML = `
                        <div class="verification-result success">
                            <div class="result-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <h3>Inscription Confirmée !</h3>
                            <div class="inscription-details">
                                <p><strong>Nom:</strong> ${inscription.nom}</p>
                                <p><strong>Type:</strong> ${inscription.type_inscription === 'participant' ? 'Participant' : 'Assistant'}</p>
                                ${inscription.categorie ? `<p><strong>Catégorie:</strong> ${inscription.categorie}</p>` : ''}
                                <p><strong>Statut:</strong> <span class="statut-confirme">Confirmé</span></p>
                                <p><strong>Confirmé par:</strong> ${inscription.confirme_par}</p>
                                <p><strong>Date de confirmation:</strong> ${inscription.date_confirmation}</p>
                            </div>
                            <p class="success-message">Votre inscription a été confirmée par l'administrateur. À bientôt à l'événement !</p>
                        </div>
                    `;
                } else {
                    resultDiv.innerHTML = `
                        <div class="verification-result warning">
                            <div class="result-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <h3>En Attente de Confirmation</h3>
                            <div class="inscription-details">
                                <p><strong>Nom:</strong> ${inscription.nom}</p>
                                <p><strong>Type:</strong> ${inscription.type_inscription === 'participant' ? 'Participant' : 'Assistant'}</p>
                                ${inscription.categorie ? `<p><strong>Catégorie:</strong> ${inscription.categorie}</p>` : ''}
                                <p><strong>Statut:</strong> <span class="statut-attente">En attente</span></p>
                                <p><strong>Date d'inscription:</strong> ${inscription.date_inscription}</p>
                            </div>
                            <p class="warning-message">Votre inscription est en attente de confirmation par l'administrateur. Vous recevrez une notification une fois confirmée.</p>
                        </div>
                    `;
                }
            }
            
            resultDiv.style.display = 'block';
            resultDiv.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            resultDiv.innerHTML = `
                <div class="verification-result error">
                    <div class="result-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>Erreur de connexion</h3>
                    <p>Impossible de vérifier l'inscription. Réessayez plus tard.</p>
                </div>
            `;
            resultDiv.style.display = 'block';
        }
    });
}

// Gestion de la connexion admin
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');
        
        // Vérification des identifiants
        if (email === "admin@otakufunconcert.ml" && password === "Admin123!") {
            db.setAdminSession({
                email: email,
                name: "Administrateur Principal",
                role: "superadmin"
            });
            window.location.href = 'admin.html';
        } else if (email === "organisateur@otakufunconcert.ml" && password === "Orga2025!") {
            db.setAdminSession({
                email: email,
                name: "Organisateur Événement", 
                role: "admin"
            });
            window.location.href = 'admin.html';
        } else {
            errorDiv.style.display = 'block';
            document.getElementById('email').style.borderColor = 'var(--error)';
            document.getElementById('password').style.borderColor = 'var(--error)';
        }
    });
}

// Protection des pages admin
if (window.location.pathname.includes('admin.html')) {
    if (!db.isAdminLoggedIn()) {
        window.location.href = 'login.html';
    }
}