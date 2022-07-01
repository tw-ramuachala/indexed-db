const BOOKS_STORE = 'books';
const createDb = () => {
    if (!('indexedDB' in window)) {
        window.alert('This browser diesn\'t support IndexedDB');
        return;
    }

    const databaseName = document.querySelector('#databaseName').value;
    const databaseVersion = document.querySelector("#databaseVersion").value;

    const request = window.indexedDB.open(databaseName, parseInt(databaseVersion, 10));

    request.onupgradeneeded = (event) => {
        window.alert('on upgrade needed');
        window.db = event.target.result;
       
        if (event.oldVersion < 1) {
            createBooksObjectStore();
        }
        db.onversionchange = event => {
            window.alert("A new version of this page is ready. Please reload or close this tab!");
            db.close();
        };
    }

    request.onblocked = event => {
        console.log(event);
        window.alert("Please close all other tabs with this site open!");
      };
    
    request.onsuccess = (event) => {
        window.alert('on success');
        window.db = request.result;
    }

    request.onerror = (event) => {
        window.alert(`on error - ${event.target.error.message}`);
    } 
}

const createBooksObjectStore = () => {
    const store = window.db.createObjectStore(BOOKS_STORE, { keyPath: "isbn" });
    store.createIndex("by_title", "title", { unique: true });
    store.createIndex("by_author", "author");

}

const insertIntoObjectStore = () => {
    const bookTitle = document.querySelector('#bookTitle');
    const authorName = document.querySelector("#authorName");

    const tx = window.db.transaction(BOOKS_STORE, "readwrite");
    const store = tx.objectStore(BOOKS_STORE);

    store.put({title: bookTitle.value, author: authorName.value, isbn: new Date().getTime()});

    tx.oncomplete = (event) => {
        console.info(event);
        window.alert("request has succeeded and the transaction has committed.");
        bookTitle.value = '';
        authorName.value = '';
    };
    
    tx.onerror = (event) => {
        console.error(event.target.error);
        window.alert(`request has failed with error: ${event.target.error}`);
    }
}

const getBookByName = () => {
    const searchTitle = document.querySelector('#searchTitle').value;

    const tx = db.transaction(BOOKS_STORE, "readonly");
    const store = tx.objectStore(BOOKS_STORE);
    const index = store.index("by_title");

    const request = index.get(searchTitle);
    request.onsuccess = () => {
        const matching = request.result;
        if (matching !== undefined) {
            console.info(matching.isbn, matching.title, matching.author);
            const searchByTitleTbody = document.querySelector('#searchByTitleTbody');
            let tr = `<tr><td>${matching.isbn}</td><td>${matching.title}</td><td>${matching.author}</td>`;
            searchByTitleTbody.innerHTML = tr;
        } else {
            window.alert("No match was found.");
        }
    };

    request.onerror = (event) => {
        console.error(event);
        window.alert("Failed to get book by name");
    }
}

const getBooksByAuthor = () => {
    const searchAuthor = document.querySelector('#searchAuthor').value;
    const tx = db.transaction("books", "readonly");
    const store = tx.objectStore("books");
    const index = store.index("by_author");

    const request = index.openCursor(IDBKeyRange.only(searchAuthor));
    const searchByTitleTbody = document.querySelector('#searchByAuthorTbody');
    let trs = '';
    request.onsuccess = function() {
        const cursor = request.result;
        if (cursor) {
            // Called for each matching record.
            console.info(cursor.value.isbn, cursor.value.title, cursor.value.author);
            trs+= `<tr><td>${cursor.value.isbn}</td><td>${cursor.value.title}</td><td>${cursor.value.author}</td>`;
            cursor.continue();
        } else {
            // No more matching records.
            console.warn("no records found");
        }
        searchByTitleTbody.innerHTML = trs;
    };
}

const getAllBooks = () => {
    const tx = db.transaction("books", "readonly");
    const store = tx.objectStore("books");

    const request = store.openCursor();
    request.onsuccess = function() {
        const cursor = request.result;
        if (cursor) {
            console.info(cursor.value.isbn, cursor.value.title, cursor.value.author);
            cursor.continue();
        } else {
            console.warn("no records found");
        }
    };
}
