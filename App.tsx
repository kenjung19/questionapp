// App.tsx
import React, { useEffect, useState } from 'react'
import { Text, View, Button, LogBox, TextInput, Alert, StyleSheet } from 'react-native'
import Question from './Question'
import LeaderboardEntry from './Leaderboard'
import AsyncStorage from '@react-native-async-storage/async-storage'

LogBox.ignoreAllLogs();

const questions: Question[] = require('./Questions.json')
const questionShow: number[] = []

const App = () => {

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [score, setScore] = useState<number | 0>(0)
  const [player, setPlayer] = useState<string>('')
  const [start, setStart] = useState<boolean>(false)
  const [finish, setFinish] = useState<boolean>(false)
  const [reset, setReset] = useState<boolean>(false)
  const [no, setNo] = useState<number | 1>(1)

  const getRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * questions.length)
    if (!questionShow.includes(randomIndex)) {
      questionShow.push(randomIndex)
      questions[randomIndex].answers = getRandomAnswer(questions[randomIndex].answers)
      setCurrentQuestion(questions[randomIndex])
      return
    }
    if (questionShow.length === 20) {
      return
    }
    getRandomQuestion()
  };

  const getRandomAnswer = (answers: string[]) => {
    return answers.sort(function () { return 0.5 - Math.random() })
  }

  const handleAnswer = async (selectedAnswer: string) => {
    console.log('questionShow.length : ', questionShow.length)
    if (questionShow.length === 20) {
      let jsonValue: string = ''
      if (leaderboardData !== null) {
        leaderboardData.map(obj => { obj.last = false })
        setLeaderboardData(leaderboardData => [...leaderboardData, { playerName: player, score: score, last: true }])
        jsonValue = JSON.stringify([...leaderboardData, { playerName: player, score: score, last: true }]);
      } else {
        setLeaderboardData([{ playerName: player, score: score, last: true }])
        jsonValue = JSON.stringify([{ playerName: player, score: score, last: true }]);
      }
      setFinish(true)
      await AsyncStorage.setItem('leaderBoard', jsonValue);
      return
    }
    if (currentQuestion) {
      setNo(no + 1)
      if (selectedAnswer === currentQuestion.correctAnswer) {
        setScore(score + 1)
      }
      getRandomQuestion()
    }
  };

  const resetQuestion = () => {
    setNo(1)
    setReset(false)
    setFinish(false)
    setScore(0)
    questionShow.length = 1
  }

  const resetScore = async () => {
    leaderboardData.length = 0
    await AsyncStorage.setItem('leaderBoard', '');
    setReset(true)
  }

  const startQuestion = async () => {
    if (player === '') {
      Alert.alert('Alert Title', 'Please input Player Name', [
        { text: 'OK', onPress: () => console.log('OK Pressed') },
      ]);
    } else {
      const jsonValue = await AsyncStorage.getItem('leaderBoard');
      const leaderBoard = jsonValue != null ? JSON.parse(jsonValue) : null;
      setLeaderboardData(leaderBoard)
      setStart(true)
    }
  }

  const conditionalRender = () => {
    if (!start) {
      return (
        <View style={{ alignSelf: 'center', marginTop: 100 }}>
          <Text style={{ alignSelf: 'center' }}>Player</Text>
          <TextInput style={{ alignSelf: 'center', marginTop: 30, borderBottomWidth: 1, width: 300, height: 40, textAlign: 'center', marginBottom: 30 }} onChangeText={newText => setPlayer(newText)}></TextInput>
          <Button title='Enter' onPress={() => startQuestion()} />
        </View>)
    } else if (!finish) {
      return (<View style={{ marginTop: 100, paddingLeft: 20, paddingRight: 20 }}>
        <Text>{currentQuestion ? no + '. ' + currentQuestion.question : ''}</Text>
        {currentQuestion ? currentQuestion.answers.map((answer, index) => (
          <Button key={index} title={answer} onPress={() => handleAnswer(answer)} />
        )) : ''}
      </View>)
    } else {
      const leaderBoard = leaderboardData.sort((a, b) => b.score - a.score).slice(0, 10).map((obj, index) => {
        return (<Text style={[styles.text, obj.last ? styles.playerLast : styles.playerFirst]}>
          {index + 1}. {obj.playerName} : {obj.score}
        </Text>)
      })
      return (<View style={{ marginTop: 100, paddingLeft: 20, paddingRight: 20 }}>
        <Text style={{ alignSelf: 'center' }}>Leaderboard Top 10</Text>
        {!reset ? leaderBoard : ''}
        <Button title='Back' onPress={() => resetQuestion()} />
        <View style={{ marginTop: 30 }}>
          <Button title='Reset' onPress={() => resetScore()} />
        </View>

      </View>)
    }
  }

  useEffect(() => {
    getRandomQuestion()
  }, [])

  const styles = StyleSheet.create({
    text: {
      textAlign: 'center',
      backgroundColor: '#cccccc',
      width: '100%'
    },
    playerLast: {
      color: '#ff0000',
    },
    playerFirst: {
      color: '#000000',
    },
  });

  return (
    <View>
      {conditionalRender()}
    </View >
  );
};

export default App
