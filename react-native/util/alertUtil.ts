import { Alert } from 'react-native';

type AlertParams = {
  title: string;
  message: string;
};

export function alert({ title, message }: AlertParams) {
  Alert.alert(title, message, [{ text: 'OK' }]);
}
