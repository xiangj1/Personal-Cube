import React, {useState} from 'react';

import firebase from './Firebase'

import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import TextField from '@material-ui/core/TextField'
import { Grid, Typography, Container, Button, Modal } from '@material-ui/core';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

import Clipboard from 'react-clipboard.js'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    submitButton: {
      margin: '0 1%',
      verticalAlign: 'bottom',
      width: '18%'
    },
    inputMessage: {
      width: '80%'
    },
    clipboard: {
      width: '100%',
      textAlign: 'left',
      border: 'none',
      background: 'border-box'
    },
    modal: {
      position: 'absolute',
      width: 400,
      backgroundColor: theme.palette.background.paper,
      border: '2px solid #000',
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4, 3),
    },
  }),
);

const firestore = firebase.firestore()
const messageCollection = firestore.collection('message')
const fileCollection = firestore.collection('file')

const storage = firebase.storage()

let count = 0;

const MessageList: React.FC<any> = ({signedIn}) => {
  const classes = useStyles()

  const [init, setInit] = useState(true)
  const [messageList, setMessageList] = useState<firebase.firestore.DocumentData>([])
  const [inputMessage, setInputMessage] = useState('')
  
  async function getMessageList(): Promise<firebase.firestore.DocumentData[]> {
    if(++count > 50) alert('STOP!!!!!')
    const messageList: firebase.firestore.DocumentData[] = []
    const querySnapshot = await messageCollection.orderBy('time', 'desc').limit(5).get()
    querySnapshot.forEach(doc => messageList.push(doc.data()))
  
    return messageList.reverse();
  }
  
  if (init && signedIn) {
    setInit(false)
    getMessageList().then(setMessageList)
  }

  function updateMessageInput(e: React.ChangeEvent<HTMLInputElement>) {
    setInputMessage(e.target.value)
  }

  function uploadMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if(inputMessage)
      messageCollection.add({ time: Date.now(), message: inputMessage }).then(getMessageList).then(setMessageList)
  }

  return (
    <div>
      <Typography variant="h3" gutterBottom >Message List</Typography>
      <List>
      {messageList.map((data: firebase.firestore.DocumentData) => 
        <ListItem button key={data.time}>
          <Clipboard data-clipboard-text={data.message} className={classes.clipboard}>
            <ListItemText
              id={data.time}
              primary={data.message}
              secondary={new Date(data.time).toLocaleString()}
            />
          </Clipboard>
        </ListItem>)}
      </List>

      <form onSubmit={uploadMessage}>
        <TextField onChange={updateMessageInput} label="New Message" className={classes.inputMessage} />
        <Button variant="contained" color="primary" type="submit" className={classes.submitButton}>Send</Button>
      </form>
    </div>
  )
}

const FileList: React.FC<any> = ({signedIn}) => {
  const [init, setInit] = useState(true)
  const [fileList, setFileList] = useState<firebase.firestore.DocumentData>([])
  const [inputFile, setInputFile] = useState<File>(new File([], ''))
  
  async function getFileList(): Promise<firebase.firestore.DocumentData[]> {
    if(++count > 50) alert('STOP!!!!!')
    const fileList: firebase.firestore.DocumentData[] = []
    const querySnapshot = await fileCollection.orderBy('time', 'desc').limit(5).get()
    querySnapshot.forEach(doc => fileList.push(doc.data()));
  
    return fileList.reverse();
  }
  
  if (init && signedIn) {
    setInit(false)
    getFileList().then(setFileList)
  }

  function updateFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0])
      setInputFile(e.target.files[0])
  }

  function uploadFile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (inputFile.name) {
      storage.ref().child(inputFile.name.split('.').shift() || '')
        .put(inputFile).then(snapshot => {
          snapshot.ref.getDownloadURL().then(url => {
            fileCollection.add({ time: Date.now(), filePath: url, fileName: inputFile.name }).then(getFileList).then(setFileList)
          })
        })
    }
  }

  return (
    <div>
      <Typography variant="h3" gutterBottom >File List</Typography>
      <List>
      {fileList.map((data: firebase.firestore.DocumentData) => 
        <ListItem button key={data.time}>
          <ListItemText
            primary={data.fileName}
            secondary={new Date(data.time).toLocaleString()}
            onClick={() => window.open(data.filePath)}
          />
        </ListItem>)}
      </List>

      <form onSubmit={uploadFile}>
        <input onChange={updateFileInput} type="file" placeholder="New File" />
        <button type="submit">Upload</button>
      </form>

      
    </div>
  )
}

const App: React.FC = () => {
  const classes = useStyles()

  const [init, setInit] = useState(true);
  const [signedIn, setSignedIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  if (init) {
    firebase.auth().onAuthStateChanged((user) => {
      setInit(false)
      setSignedIn(!!user)
    })
  }

  const updateEmail = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
  const updatePassword = (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value);

  function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    firebase.auth().signInWithEmailAndPassword(email, password).catch(alert)
  }

  return (
    <Container>
      <Modal open={!signedIn}>
        <form onSubmit={signIn} className={classes.modal}>
          <TextField label="username" onChange={updateEmail} />
          <TextField label="password" onChange={updatePassword} />
          <Button type="submit" color='primary' className={classes.submitButton}>Log In</Button>
        </form>
      </Modal>
      <Grid container spacing={5} >
        <Grid item md={12} lg={6} >
          <MessageList signedIn={signedIn} />
        </Grid>
        <Grid item md={12} lg={6} >
          <FileList signedIn={signedIn} />
        </Grid>
      </Grid>
    </Container>
  );
}

export default App;
