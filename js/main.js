(() => {
  'use strict';

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  const db = firebase.firestore();
  const collection = db.collection('messages');

  const auth = firebase.auth();
  let me = null;

  const message = document.getElementById('message');
  const form = document.querySelector('form');

  const messages = document.getElementById('messages');
  const login = document.getElementById('login');
  const logout = document.getElementById('logout');


  login.addEventListener('click', () => {
    auth.signInAnonymously();
  });

  logout.addEventListener('click', () => {
    auth.signOut();
  });

  auth.onAuthStateChanged(user => {
    if(user){
      me = user;

      while (messages.firstChild) {
        messages.removeChild(messages.firstChild)
      }

      // collection (データベース) の内容を messages（html上で定義した箇条書きエリア）に全て追加する
      // messagesの内容は即座にhtml上に反映される？
      // (onSnapshotを使わない場合) この処理は最初に画面が表示されたときに一度だけ呼ばれる
      collection.orderBy('created').onSnapshot(snapshot => { // collectionに変化があるたびに呼ばれる
        snapshot.docChanges().forEach(change => {
          if (change.type == 'added'){
            const li = document.createElement('li');
            const d = change.doc.data();
            //li.textContent = d.uid.substr(0, 8) + ': ' + change.doc.data().message;
            li.textContent = change.doc.data().source + ' -> ' + change.doc.data().target;
            messages.appendChild(li);
          }
        })
      }, error => {});
      console.log(`Logged in as: ${user.uid}`);
      login.classList.add('hidden');
      [logout, form, messages].forEach(el => {
        el.classList.remove('hidden');
      })
      // カーソルをテキストボックスの先頭にする
      // 最初にページを開いたとき用
      message.focus();
      return;
    }
    me = null;
    login.classList.remove('hidden');
    [logout, form, messages].forEach(el => {
      el.classList.add('hidden');
    console.log('Nobody is logged in');
    })
  })


  // この処理はフォームから値が送信されるたびに呼ばれる
  form.addEventListener('submit', e => {
    e.preventDefault();

    // message (html上のinputタグで送信された文字列) の内容をvalに格納する
    var val = message.value.trim();

    // 入力が空だったら何もしない
    if (val == ""){
      return;
    }

    // 翻訳
    var request = new XMLHttpRequest();
    var url_en2ja = google_translation_base_url + '?text=' + val + '&source=en&target=ja'
    var url_ja2en = google_translation_base_url + '?text=' + val + '&source=ja&target=en'
    request.open('GET', url_ja2en, true);
    // レスポンスが返ってきた時の処理を記述
    request.onload = function () {
      // レスポンスが返ってきた時の処理
      var data = this.response;

      // messageを初期化し、カーソルを元に戻す
      message.value = '';
      message.focus();

      // collection (データベース)にvalを追加する
      collection.add({
        source: val,
        target: data,
        created: firebase.firestore.FieldValue.serverTimestamp(),
        uid: me ? me.uid : 'nobody'
      })
      .then(doc => {
        console.log(`${doc.id} added!`)
      })
      .catch(error => {
        console.log('document add error')
        console.log(error)
      })
    }

    request.send()

    // valをmessagesに追加する
    // messagesの内容はappendされたら即座にhtml上に反映される？
    // onSnapshotを使うなら要らない
    /*
    const li = document.createElement('li');
    li.textContent = val;
    messages.appendChild(li);
    */
  })
})();
