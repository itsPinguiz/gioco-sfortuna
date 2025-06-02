import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Sample misfortune cards data for university life
const misfortuneCards = [
  { name: "Computer rubato", 
    image_url: "/images/cards/stolen_laptop.jpg", 
    misfortune_index: 97.0 },

  { name: "PC si spegne durante l'esame online", 
    image_url: "/images/cards/pc_crash.jpg", 
    misfortune_index: 95.0 },

  { name: "Perdere il portafoglio", 
    image_url: "/images/cards/lost_wallet.jpg", 
    misfortune_index: 93.0 },

  { name: "Dimenticato l'esame", 
    image_url: "/images/cards/forgot_exam.jpg", 
    misfortune_index: 90.0 },

  { name: "Scadenza di un progetto dimenticata", 
    image_url: "/images/cards/missed_deadline.jpg", 
    misfortune_index: 89.0 },

  { name: "Bocciato all'esame", 
    image_url: "/images/cards/failed_exam.jpg", 
    misfortune_index: 88.0 },

  { name: "Inviare un progetto al professore sbagliato", 
    image_url: "/images/cards/wrong_email.jpg", 
    misfortune_index: 87.5 },

  { name: "Essere beccati a copiare durante un esame", 
    image_url: "/images/cards/stairs_fall.jpg", 
    misfortune_index: 87.0 },

  { name: "Consegna in ritardo", 
    image_url: "/images/cards/late_submission.jpg", 
    misfortune_index: 86.5 },

  { name: "Perdere gli appunti",
    image_url: "/images/cards/lost_notes.jpg", 
    misfortune_index: 86.0 },

  { name: "Mal di testa durante l'esame", 
    image_url: "/images/cards/exam_headache.jpg", 
    misfortune_index: 85.5 },

  { name: "File con la tesi corrotto", 
    image_url: "/images/cards/corrupted_thesis.jpg",
    misfortune_index: 85.0 },

  { name: "Iscrizione all'esame non registrata", 
    image_url: "/images/cards/failed_registration.jpg", 
    misfortune_index: 84.0 },

  { name: "Compagno di studio inaffidabile", 
    image_url: "/images/cards/unreliable_partner.jpg", 
    misfortune_index: 83.0 },

  { name: "Compagno di stanza rumoroso", 
    image_url: "/images/cards/noisy_roommate.jpg", 
    misfortune_index: 80.0 },

  { name: "Rimanere chiusi in biblioteca", 
    image_url: "/images/cards/locked_library.jpg",
    misfortune_index: 75.0 },

  { name: "Argomento esame mai studiato", 
    image_url: "/images/cards/unknown_topic.jpg", 
    misfortune_index: 74.5 },

  { name: "Telefono suona durante l'esame", 
    image_url: "/images/cards/phone_rings.jpg", 
    misfortune_index: 74.0 },

  { name: "Git rebase distrugge il progetto", 
    image_url: "/images/cards/group_split.jpg", 
    misfortune_index: 73.5 },

  { name: "Macchiare i vestiti prima di una presentazione", 
    image_url: "/images/cards/stained_clothes.jpg", 
    misfortune_index: 73.0 },

  { name: "Sveglia non suona", 
    image_url: "/images/cards/missed_alarm.jpg", 
    misfortune_index: 70.0 },

  { name: "Esame rinviato", 
    image_url: "/images/cards/postponed_exam.jpg",
    misfortune_index: 67.0 },

  { name: "Presentazione cancellata", 
    image_url: "/images/cards/canceled_presentation.jpg", 
    misfortune_index: 66.0 },

  { name: "Caffè rovesciato sugli appunti", 
    image_url: "/images/cards/coffee_notes.jpg", 
    misfortune_index: 65.0 },

  { name: "Consegna d'esame illeggibile", 
    image_url: "/images/cards/illegible_handout.jpg", 
    misfortune_index: 60.0 },

  { name: "Studente rumoroso in biblioteca", 
    image_url: "/images/cards/noisy_student.jpg", 
    misfortune_index: 55.0 },

  { name: "Cibo della mensa terribile", 
    image_url: "/images/cards/bad_cafeteria.jpg", 
    misfortune_index: 52.0 },

  { name: "Cercare parcheggio per ore", 
    image_url: "/images/cards/parking_nightmare.jpg", 
    misfortune_index: 50.0 },

  { name: "Pioggia senza ombrello", 
    image_url: "/images/cards/rain_no_umbrella.jpg",
    misfortune_index: 45.0 },

  { name: "Lezione cambiata all'ultimo", 
    image_url: "/images/cards/room_change.jpg", 
    misfortune_index: 43.0 },

  { name: "Microfono acceso durante una lezione online", 
    image_url: "/images/cards/mic_on.jpg", 
    misfortune_index: 42.0 },

  { name: "Professore arrabbiato", 
    image_url: "/images/cards/angry_professor.jpg", 
    misfortune_index: 40.0 },

  { name: "Computer scarico prima della lezione", 
    image_url: "/images/cards/dead_powerbank.jpg", 
    misfortune_index: 38.0 },

  { name: "Non salvare modifiche appunti", 
    image_url: "/images/cards/lost_keys.jpg", 
    misfortune_index: 35.0 },

  { name: "Branch di lavoro cancellata", 
    image_url: "/images/cards/textbook_offline.jpg", 
    misfortune_index: 33.0 },

  { name: "Pranzo al sacco dimenticato", 
    image_url: "/images/cards/no_books.jpg", 
    misfortune_index: 32.0 },

  { name: "Rimanere indietro con gli appunti delle lezioni", 
    image_url: "/images/cards/stuck_elevator.jpg", 
    misfortune_index: 30.0 },

  { name: "Macchinetta del caffè rotta", 
    image_url: "/images/cards/messy_roommates.jpg", 
    misfortune_index: 28.0 },

  { name: "Professore che parla troppo velocemente", 
    image_url: "/images/cards/fast_professor.jpg", 
    misfortune_index: 27.0 },

  { name: "Pagina web dell'università non funziona", 
    image_url: "/images/cards/website_down.jpg", 
    misfortune_index: 25.0 },

  { name: "Lezione cancellata", 
    image_url: "/images/cards/class_canceled.jpg", 
    misfortune_index: 20.0 },

  { name: "Trovare l'aula occupata", 
    image_url: "/images/cards/occupied_room.jpg", 
    misfortune_index: 18.5 },

  { name: "Perdersi nel campus", 
    image_url: "/images/cards/lost_campus.jpg", 
    misfortune_index: 18.0 },

  { name: "Autobus in ritardo", 
    image_url: "/images/cards/late_bus.jpg", 
    misfortune_index: 17.5 },

  { name: "Ritardo del professore", 
    image_url: "/images/cards/late_professor.jpg", 
    misfortune_index: 17.0 },

  { name: "Dormire durante la lezione", 
    image_url: "/images/cards/sleeping_class.jpg", 
    misfortune_index: 15.0 },

  { name: "Connessione internet instabile", 
    image_url: "/images/cards/unstable_internet.jpg", 
    misfortune_index: 14.0 },

  { name: "Stampante non funziona", 
    image_url: "/images/cards/printer_fail.jpg", 
    misfortune_index: 13.0 },

  { name: "Dimenticato il badge universitario", 
    image_url: "/images/cards/forgotten_badge.jpg", 
    misfortune_index: 10.0 },

  { name: "Dimenticare la password dell'account universitario", 
    image_url: "/images/cards/forgot_password.jpg", 
    misfortune_index: 8.0 },

  { name: "Penna che smette di scrivere", 
    image_url: "/images/cards/pen_stops.jpg", 
    misfortune_index: 5.0 }
];

// Sample user data
const sampleUsers = [
  { email: 'user1@example.com', username: 'user1', password: 'P@ssw0rd1', salt: '' },
  { email: 'user2@example.com', username: 'user2', password: 'P@ssw0rd2', salt: '' }
];

// Function to create images directory if it doesn't exist
const createImagesDirectory = () => {
  const imagesDir = path.join(__dirname, '..', 'public', 'images', 'cards');
  
  // Create directories recursively
  fs.mkdirSync(imagesDir, { recursive: true });
};

// Function to create placeholder images
const createPlaceholderImages = () => {
  const cardsDir = path.join(__dirname, '..', 'public', 'images', 'cards');
  
  // Create a basic SVG for each card
  misfortuneCards.forEach((card, index) => {
    const imageName = card.image_url.split('/').pop();
    const imagePath = path.join(cardsDir, imageName);
    
    // Skip if file already exists
    if (fs.existsSync(imagePath)) return;
    
    // Create a simple colored SVG based on the misfortune index
    const intensity = Math.min(Math.floor(card.misfortune_index / 10) * 25, 255);
    const color = `rgb(${intensity}, ${Math.max(0, 255 - intensity)}, 0)`;
    
    const svg = `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}" />
      <text x="50%" y="50%" font-family="Arial" font-size="20" fill="white" text-anchor="middle">
        ${card.name}
      </text>
      <text x="50%" y="70%" font-family="Arial" font-size="16" fill="white" text-anchor="middle">
        Sfortuna: ${card.misfortune_index}
      </text>
    </svg>`;
    
    fs.writeFileSync(imagePath, svg);
  });
};

export { misfortuneCards, sampleUsers, createImagesDirectory, createPlaceholderImages };
