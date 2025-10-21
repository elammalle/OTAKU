// script.js - Version corrigée
class Database {
    constructor() {
        this.key = 'otaku_fun_concert_inscriptions';
        this.adminKey = 'admin_session';
        this.init();
    }
    
    init() {
        if (!localStorage.getItem(this.key)) {
            const initialData = [];
            this.save(initialData);
        }
    }
    
    getInscriptions() {
        const data = localStorage.getItem(this.key);
        return data ? JSON.parse(data) : [];
    }
    
    save(data) {
        localStorage.setItem(this.key, JSON.stringify(data));
    }
    
    addInscription(inscription) {
        const inscriptions = this.getInscriptions();
        const newId = inscriptions.length > 0 ? Math.max(...inscriptions.map(i => i.id)) + 1 : 1;
        
        const newInscription = {
            id: newId,
            ...inscription,
            statut: "en_attente",
            date_inscription: new Date().toLocaleDateString('fr-FR'),
            date_confirmation: "",
            confirme_par: ""
        };
        
        inscriptions.push(newInscription);
        this.save(inscriptions);
        return newInscription;
    }
    
    confirmerInscription(id, adminName) {
        let inscriptions = this.getInscriptions();
        const inscriptionIndex = inscriptions.findIndex(i => i.id === id);
        
        if (inscriptionIndex !== -1) {
            inscriptions[inscriptionIndex].statut = "confirmé";
            inscriptions[inscriptionIndex].date_confirmation = new Date().toLocaleDateString('fr-FR');
            inscriptions[inscriptionIndex].confirme_par = adminName;
            this.save(inscriptions);
            return true;
        }
        return false;
    }
    
    deleteInscription(id) {
        let inscriptions = this.getInscriptions();
        inscriptions = inscriptions.filter(inscription => inscription.id !== id);
        this.save(inscriptions);
        return true;
    }
    
    getInscriptionByPhone(phone) {
        const inscriptions = this.getInscriptions();
        return inscriptions.find(inscription => 
            inscription.contact === phone
        );
    }
    
    getInscriptionsByStatut(statut) {
        const inscriptions = this.getInscriptions();
        return inscriptions.filter(inscription => inscription.statut === statut);
    }
    
    filterInscriptions(category = '', search = '', statut = '') {
        let inscriptions = this.getInscriptions();
        
        if (statut) {
            inscriptions = inscriptions.filter(inscription => 
                inscription.statut === statut
            );
        }
        
        if (category) {
            inscriptions = inscriptions.filter(inscription => 
                inscription.categorie === category
            );
        }
        
        if (search) {
            const searchLower = search.toLowerCase();
            inscriptions = inscriptions.filter(inscription => 
                inscription.nom.toLowerCase().includes(searchLower) ||
                inscription.contact.includes(search)
            );
        }
        
        return inscriptions;
    }
    
    setAdminSession(adminData) {
        const session = {
            ...adminData,
            loginTime: new Date().getTime(),
            expires: new Date().getTime() + 3600000
        };
        localStorage.setItem(this.adminKey, JSON.stringify(session));
    }
    
    getAdminSession() {
        const session = localStorage.getItem(this.adminKey);
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
        localStorage.removeItem(this.adminKey);
    }
    
    isAdminLoggedIn() {
        return this.getAdminSession() !== null;
    }
}

// Initialisation
const db = new Database();

// Gestion du formulaire d'inscription
document.addEventListener('DOMContentLoaded', function() {
    // Inscription
    if (document.getElementById('registration-form')) {
        const typeInscription = document.getElementById('type_inscription');
        const categorieGroup = document.getElementById('categorie-group');
        const videoGroup = document.getElementById('video-group');
        const montantAPayer = document.getElementById('montant-a-payer');
        const referencePaiement = document.getElementById('reference-paiement');
        
        typeInscription.addEventListener('change', function() {
            const type = this.value;
            
            if (type === 'participant') {
                categorieGroup.style.display = 'block';
                videoGroup.style.display = 'block';
                montantAPayer.textContent = '2 000 FCFA';
                if (document.getElementById('categorie')) 
                    document.getElementById('categorie').required = true;
                if (document.getElementById('video')) 
                    document.getElementById('video').required = true;
            } else if (type === 'assistant') {
                categorieGroup.style.display = 'none';
                videoGroup.style.display = 'none';
                montantAPayer.textContent = '1 500 FCFA';
                if (document.getElementById('categorie')) 
                    document.getElementById('categorie').required = false;
                if (document.getElementById('video')) 
                    document.getElementById('video').required = false;
            } else {
                categorieGroup.style.display = 'none';
                videoGroup.style.display = 'none';
                montantAPayer.textContent = '-';
            }
            
            const nom = document.getElementById('nom').value;
            if (nom) {
                referencePaiement.textContent = nom.substring(0, 10);
            }
        });
        
        document.getElementById('nom').addEventListener('input', function() {
            if (this.value) {
                referencePaiement.textContent = this.value.substring(0, 10);
            }
        });
        
        document.getElementById('registration-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const type = document.getElementById('type_inscription').value;
            const nom = document.getElementById('nom').value.trim();
            const age = parseInt(document.getElementById('age').value);
            const contact = document.getElementById('contact').value.trim();
            const codeTransaction = document.getElementById('code_transaction').value.trim();
            
            if (!type || !nom || !age || !contact || !codeTransaction) {
                alert('Veuillez remplir tous les champs obligatoires.');
                return;
            }
            
            if (age < 12 || age > 60) {
                alert('L\'âge doit être compris entre 12 et 60 ans.');
                return;
            }
            
            let categorie = '';
            let video = '';
            let montant = 0;
            
            if (type === 'participant') {
                categorie = document.getElementById('categorie').value;
                video = document.getElementById('video').value.trim();
                montant = 2000;
                
                if (!categorie || !video) {
                    alert('Pour les participants, la catégorie et le lien vidéo sont obligatoires.');
                    return;
                }
            } else {
                montant = 1500;
            }
            
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
            
            db.addInscription(formData);
            window.location.href = 'confirmation.html';
        });
    }
    
    // Vérification
    if (document.getElementById('verification-form')) {
        document.getElementById('verification-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const phone = document.getElementById('phone_verification').value.trim();
            const resultDiv = document.getElementById('verification-result');
            
            if (!phone) {
                alert('Veuillez entrer votre numéro de téléphone.');
                return;
            }
            
            const inscription = db.getInscriptionByPhone(phone);
            
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
        });
    }
    
    // Connexion admin
    if (document.getElementById('login-form')) {
        document.getElementById('login-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('login-error');
            
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
    
    // Protection admin
    if (window.location.pathname.includes('admin.html')) {
        if (!db.isAdminLoggedIn()) {
            window.location.href = 'login.html';
        }
    }
});