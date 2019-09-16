import firebase from 'firebase/app'
import firebaseConfig from './FirebaseConfig';
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/storage'

firebase.initializeApp(firebaseConfig)

export default firebase