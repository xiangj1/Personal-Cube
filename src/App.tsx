import React, {useState} from 'react';

import firebase from 'firebase/app'
import firebaseConfig from './FirebaseConfig';
import 'firebase/firestore'
import 'firebase/storage'

import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import TextField from '@material-ui/core/TextField'
import { Grid, Typography, Container, Button } from '@material-ui/core';
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
    }
  }),
);


firebase.initializeApp(firebaseConfig)
const firestore = firebase.firestore()
const messageCollection = firestore.collection('message')
const fileCollection = firestore.collection('file')

const storage = firebase.storage()

let messageInit = true;
let fileInit = true;
let count = 0;

const MessageList: React.FC = () => {
  const classes = useStyles()

  const [messageList, setMessageList] = useState<firebase.firestore.DocumentData>([])
  const [inputMessage, setInputMessage] = useState('')
  
  async function getMessageList(): Promise<firebase.firestore.DocumentData[]> {
    if(++count > 50) alert('STOP!!!!!')
    const messageList: firebase.firestore.DocumentData[] = []
    const querySnapshot = await messageCollection.orderBy('time', 'desc').limit(5).get()
    querySnapshot.forEach(doc => messageList.push(doc.data()))
  
    return messageList.reverse();
  }
  
  if (messageInit) {
    messageInit = false;
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

const FileList: React.FC = () => {
  const [fileList, setFileList] = useState<firebase.firestore.DocumentData>([])
  const [inputFile, setInputFile] = useState<File>(new File([], ''))
  
  async function getFileList(): Promise<firebase.firestore.DocumentData[]> {
    if(++count > 50) alert('STOP!!!!!')
    const fileList: firebase.firestore.DocumentData[] = []
    const querySnapshot = await fileCollection.orderBy('time', 'desc').limit(5).get()
    querySnapshot.forEach(doc => fileList.push(doc.data()));
  
    return fileList.reverse();
  }
  
  if (fileInit) {
    fileInit = false;
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
  return (
    <Container>
    <Grid container >
      <Grid item md={12} lg={6} >
        <MessageList />
      </Grid>
      <Grid item md={12} lg={6} >
        <FileList />
      </Grid>
      </Grid>
    </Container>
  );
}

export default App;
