const apiBaseUrl = 'http://localhost:3000/api';

function showMessage(message, type = 'danger', messageElementId = 'message') {
    const messageDiv = document.getElementById(messageElementId);
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `alert alert-${type} mt-4 mb-3`;
    } else {
        console.warn(`Element za poruke sa ID-jem '${messageElementId}' nije pronađen.`);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');

    // Provera da li je HTML element za kalendar pronađen.
    if (!calendarEl) {
        console.error("KRITIČNA GREŠKA: HTML element #calendar nije pronađen!");
        if (typeof showMessage === 'function') showMessage("Greška: Kontejner za kalendar nije pronađen.", "danger");
        return;
    }

    // Provera da li je FullCalendar biblioteka uopšte učitana.
    if (typeof FullCalendar === 'undefined' || !FullCalendar.Calendar) {
        console.error("KRITIČNA GREŠKA: FullCalendar biblioteka (FullCalendar.Calendar) NIJE UČITANA ili nije dostupna! Proveri da li je main.min.js od FullCalendar-a uključen PRE ove skripte.");
        if (typeof showMessage === 'function') showMessage("Greška: Biblioteka za kalendar nije dostupna.", "danger");
        return;
    }

    try {
        const calendar = new FullCalendar.Calendar(calendarEl, {
            // initialView: Određuje koji prikaz kalendara će biti inicijalno prikazan (npr. mesečni).
            // FullCalendar v5 bi trebalo automatski da učita dayGridPlugin za ovaj prikaz ako koristiš 'main.min.js' paket.
            initialView: 'dayGridMonth', // Ovaj prikaz automatski koristi dayGridPlugin
            // headerToolbar: Konfiguriše izgled zaglavlja kalendara
            headerToolbar: {
                left: 'prev next today', // Dugmici za napred i nazad
                center: 'title', // Naslov
                right: 'dayGridMonth dayGridWeek' // Dugmici za mesecni i nedeljni prikaz 
            },
            height: 'auto', // Podesi visinu automatski prema sadržaju
              // Funkcija koja dohvata događaje (isteke registracija)
            events: async function(fetchInfo, successCallback, failureCallback) {
                try {
                    const response = await fetch(`${apiBaseUrl}/vehicles`);
                    if (!response.ok) {
                        let errorMsg = `HTTP greška! Status: ${response.status}`;
                        try { const errData = await response.json(); errorMsg = errData.error || errorMsg; } catch (e) {}
                        throw new Error(errorMsg);
                    }
                    const vehicles = await response.json();
                    if (!Array.isArray(vehicles)) {
                        throw new Error("Neočekivani format podataka sa servera.");
                    }
                    // Mapiraj podatke o vozilima u format koji FullCalendar razume
                    const events = vehicles.map(vehicle => {
                        if (!vehicle.expiration_date || typeof vehicle.expiration_date !== 'string') {
                            return null;
                        }
                        let eventClassName = 'event-success'; // Podrazumevana CSS klasa (zelena boja).
                       
                        try {
                              // Parsiraj string datuma isteka u Date objekat.
                            const expDateObj = new Date(vehicle.expiration_date); // Očekuje YYYY-MM-DD
                             // Proveri da li je parsiranje datuma uspelo.
                            if (!isNaN(expDateObj.getTime())) {
                                const today = new Date();
                                // Koristi UTC za konzistentno poređenje samo datuma, bez uticaja vremenskih zona.
                                const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
                                const expDateUTC = new Date(Date.UTC(expDateObj.getUTCFullYear(), expDateObj.getUTCMonth(), expDateObj.getUTCDate()));
                                 // Izračunaj razliku u vremenu (milisekunde) i danima.
                                const diffTime = expDateUTC.getTime() - todayUTC.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                 // Odredi CSS klasu (boju) na osnovu razlike u danima.
                                if (diffDays < 0) { eventClassName = 'event-danger'; }
                                else if (diffDays < 7) { eventClassName = 'event-danger'; }
                                else if (diffDays < 30) { eventClassName = 'event-warning';}
                            }
                        } catch (e) {}
                         // Vrati objekat događaja u formatu koji FullCalendar očekuje.
                        return {
                            // Tekst koji se prikazuje za događaj.
                            title: `${vehicle.mark || ''} ${vehicle.model || ''} (${vehicle.registration_number || 'N/A'})`, 
                            start: vehicle.expiration_date, // Mora biti YYYY-MM-DD
                            allDay: true,  // Događaj traje ceo dan.
                            classNames: [eventClassName], // Niz CSS klasa za stilizovanje događaja (bojenje).
                        };
                    }).filter(event => event !== null); // Ukloni sve 'null' vrednosti iz niza (vozila bez validnog datuma).

                    successCallback(events);

                } catch (error) {
                    console.error('Greška pri dohvatanju vozila za kalendar:', error);
                     // Prikaži grešku korisniku.
                    if (typeof showMessage === 'function') showMessage(`Greška pri učitavanju događaja: ${error.message}`, 'danger');
                    if (typeof failureCallback === 'function') failureCallback(error);
                }
            }
        });

        calendar.render();
        console.log("FullCalendar.render() pozvan.");

    } catch (initError) {
         // Uhvati greške koje mogu nastati prilikom kreiranja instance FullCalendar.Calendar.
        console.error("Greška pri inicijalizaciji FullCalendar-a:", initError);
        if (typeof showMessage === 'function') showMessage("Greška pri inicijalizaciji kalendara.", "danger");
    }
});