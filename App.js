import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity } from 'react-native';
import * as SQLite from 'expo-sqlite';
import axios from 'axios';

const db = SQLite.openDatabase('beers.db');

const App = () => {
  const [beerData, setBeerData] = useState([]);
  const [selectedBeer, setSelectedBeer] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS beers (id INTEGER PRIMARY KEY AUTOINCREMENT, brand TEXT, name TEXT, style TEXT)'
      );
    });

    loadBeerData();
  }, []);

  const fetchRandomBeer = async () => {
    try {
      const response = await axios.get('https://random-data-api.com/api/beer/random_beer');
      const data = response.data;

      db.transaction((tx) => {
        tx.executeSql(
          'INSERT INTO beers (brand, name, style) VALUES (?, ?, ?)',
          [data.brand, data.name, data.style],
          (_, { rowsAffected }) => {
            if (rowsAffected > 0) {
              setBeerData([...beerData, { id: rowsAffected, ...data }]);
            }
          },
          (_, error) => console.error(error)
        );
      });
    } catch (error) {
      console.error(error);
    }
  };

  const resetBeerData = () => {
    db.transaction((tx) => {
      tx.executeSql('DELETE FROM beers', [], () => {
        setBeerData([]);
      });
    });
  };

  const loadBeerData = () => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM beers',
        [],
        (_, { rows }) => {
          const data = rows._array;
          setBeerData(data);
        },
        (_, error) => console.error(error)
      );
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => setSelectedBeer(item)}>
      <Text> Marca: {item.brand}</Text>
      <Text> Nome: {item.name}</Text>
      <Text> Estilo:{item.style}</Text>
    </TouchableOpacity>
  );

  const handleGoBack = () => {
    setSelectedBeer(null);
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {!selectedBeer && (
        <Button title="Obter Cerveja Aleatória" onPress={fetchRandomBeer} />
      )}
      {selectedBeer ? (
        <View>
          <Button title="Voltar" onPress={handleGoBack} />
          <Text>Marca: {selectedBeer.brand}</Text>
          <Text>Nome: {selectedBeer.name}</Text>
          <Text>Estilo: {selectedBeer.style}</Text>
        </View>
      ) : (
        <FlatList
          data={beerData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
        />
      )}
      {!!beerData.length && (
        <Button title="Resetar Lista" onPress={resetBeerData} />
      )}
    </View>
  );
};

export default App;
