// Gestion de la base de données JSON simulée
class Database {
    constructor() {
        this.key = 'otaku_fun_concert_inscriptions';
        this.adminKey = 'admin_session';
        this.init();
    }
    
    init() {
        // Initialiser le stockage s'il n'existe pas
        if (!localStorage.getItem(this.key)) {
            const initialData = [
                {
                    id: 1,
                    type_inscription: "participant",
                    nom: "Moussa Koné",
                    age: 22,
                    contact: "+223 76 45 32 10",
                    categorie: "chant",
                    video: "https://youtube.com/example1",
                    code_transaction: "TX123456",
                    montant: 2000,
                    statut: "confirmé",
                    date_inscription: "2024-10-15",
                    date_confirmation: "2024-10-15",
                    confirme_par: "Admin"
                },
                {
                    id: 2,
                    type_inscription: "assistant",
                    nom: "Aïcha Traoré", 
                    age: 19,
                    contact: "+223 65 43 21 09",
                    categorie: "",
                    video: "",
                    code_transaction: "TX654321",
                    montant: 1500,
                    statut: "en_attente",
                    date_inscription: "2024-10-16",
                    date_confirmation: "",
                    confirme_par: ""
                }
            ];
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
            date_inscription: new Date().toISOString().split('T')[0],
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
            inscriptions[inscriptionIndex].date_confirmation = new Date().toISOString().split('T')[0];
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
    
    // Gestion de session admin
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

// Initialisation de la base de données
const db = new Database();

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
            document.getElementById('categorie').required = true;
            document.getElementById('video').required = true;
        } else if (type === 'assistant') {
            categorieGroup.style.display = 'none';
            videoGroup.style.display = 'none';
            montantAPayer.textContent = '1 500 FCFA';
            document.getElementById('categorie').required = false;
            document.getElementById('video').required = false;
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
    
    document.getElementById('registration-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validation des champs
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
        
        // Validation spécifique pour les participants
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
        db.addInscription(formData);
        
        // Redirection vers la page de confirmation
        window.location.href = 'confirmation.html';
    });
}

// Gestion de la vérification d'inscription
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

// Code.gs - Version avec initialisation automatique
function initializeSheet() {
  try {
    const sheet = SpreadsheetApp.openById('1h4tJRcepnFFNqbucs0SOF2Gyy8TbpP81ID11cjPSOLg').getActiveSheet();
    
    // Vérifier si le sheet est vide ou non initialisé
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    if (lastRow === 0 || lastCol < 12) {
      // Définir les en-têtes des colonnes
      const headers = [
        'id', 'date_inscription', 'nom', 'age', 'contact', 
        'type_inscription', 'categorie', 'montant', 'code_transaction', 
        'statut', 'confirme_par', 'date_confirmation'
      ];
      
      // Effacer tout le contenu existant
      sheet.clear();
      
      // Ajouter les en-têtes
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Formater les en-têtes
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#4CAF50')
        .setFontColor('white')
        .setFontWeight('bold')
        .setHorizontalAlignment('center');
      
      // Ajuster la largeur des colonnes
      sheet.autoResizeColumns(1, headers.length);
      
      Logger.log('Sheet initialisé avec succès avec ' + headers.length + ' colonnes');
      return {
        status: 'success',
        message: 'Sheet initialisé avec ' + headers.length + ' colonnes',
        headers: headers
      };
    } else {
      Logger.log('Sheet déjà initialisé');
      return {
        status: 'info', 
        message: 'Sheet déjà initialisé avec ' + lastCol + ' colonnes'
      };
    }
    
  } catch (error) {
    Logger.error('Erreur initialisation: ' + error.toString());
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

function doPost(e) {
  try {
    // Initialiser le sheet si nécessaire
    initializeSheet();
    
    const sheet = SpreadsheetApp.openById('1h4tJRcepnFFNqbucs0SOF2Gyy8TbpP81ID11cjPSOLg').getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    // Trouver le prochain ID
    const lastRow = sheet.getLastRow();
    let newId = 1;
    
    if (lastRow > 1) {
      const lastId = sheet.getRange(lastRow, 1).getValue();
      newId = lastId + 1;
    }
    
    // Préparer la nouvelle ligne
    const row = [
      newId, // A - id
      new Date(), // B - date_inscription
      data.nom, // C - nom
      data.age, // D - age
      data.contact, // E - contact
      data.type_inscription, // F - type_inscription
      data.categorie || '', // G - categorie
      data.montant, // H - montant
      data.code_transaction, // I - code_transaction
      'en_attente', // J - statut
      '', // K - confirme_par
      '' // L - date_confirmation
    ];
    
    // Ajouter la nouvelle ligne
    sheet.appendRow(row);
    
    // Formater la nouvelle ligne
    const newRowRange = sheet.getRange(lastRow + 1, 1, 1, row.length);
    if (lastRow % 2 === 0) {
      newRowRange.setBackground('#f9f9f9');
    }
    
    Logger.log('Nouvelle inscription ID: ' + newId);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      id: newId,
      message: 'Inscription sauvegardée avec succès'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.error('Erreur doPost: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    // Initialiser le sheet si nécessaire
    initializeSheet();
    
    const sheet = SpreadsheetApp.openById('1h4tJRcepnFFNqbucs0SOF2Gyy8TbpP81ID11cjPSOLg').getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Convertir en JSON avec les en-têtes comme clés
    const headers = data[0];
    const inscriptions = data.slice(1).map((row, index) => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i];
      });
      return obj;
    });
    
    Logger.log('Retour de ' + inscriptions.length + ' inscriptions');
    
    return ContentService.createTextOutput(JSON.stringify(inscriptions))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.error('Erreur doGet: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Fonction pour confirmer une inscription (pour l'admin)
function confirmInscription() {
  try {
    const sheet = SpreadsheetApp.openById('1h4tJRcepnFFNqbucs0SOF2Gyy8TbpP81ID11cjPSOLg').getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // Récupérer les paramètres
    const params = JSON.parse(e.postData.contents);
    const id = params.id;
    const adminName = params.adminName || 'Admin';
    
    let found = false;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) { // Colonne A = ID
        sheet.getRange(i + 1, 10).setValue('confirmé'); // Colonne J = statut
        sheet.getRange(i + 1, 11).setValue(adminName); // Colonne K = confirme_par
        sheet.getRange(i + 1, 12).setValue(new Date()); // Colonne L = date_confirmation
        found = true;
        break;
      }
    }
    
    if (found) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Inscription ' + id + ' confirmée par ' + adminName
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Inscription non trouvée'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Fonction pour réinitialiser complètement le sheet (attention!)
function resetSheet() {
  try {
    const sheet = SpreadsheetApp.openById('1h4tJRcepnFFNqbucs0SOF2Gyy8TbpP81ID11cjPSOLg').getActiveSheet();
    sheet.clear();
    
    const result = initializeSheet();
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Sheet réinitialisé avec succès'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Fonction de test pour vérifier la connexion
function testConnection() {
  try {
    const sheet = SpreadsheetApp.openById('1h4tJRcepnFFNqbucs0SOF2Gyy8TbpP81ID11cjPSOLg').getActiveSheet();
    const lastRow = sheet.getLastRow();
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Connexion réussie au Google Sheet',
      sheetName: sheet.getName(),
      totalRows: lastRow,
      isInitialized: lastRow > 0
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}