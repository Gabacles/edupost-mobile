import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/Login/LoginScreen';
import RegisterScreen from '../screens/Register/RegisterScreen';
import PostsListScreen from '../screens/Posts/PostsListScreen';
import PostDetailScreen from '../screens/Posts/PostDetailScreen';
import CreatePostScreen from '../screens/Posts/CreatePostScreen';
import EditPostScreen from '../screens/Posts/EditPostScreen';
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import TeachersScreen from '../screens/Teachers/TeachersScreen';
import StudentsScreen from '../screens/Students/StudentsScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  PostsList: undefined;
  PostDetail: { postId: number };
  CreatePost: undefined;
  EditPost: { postId: number };
  AdminDashboard: undefined;
  Teachers: undefined;
  Students: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Top‑level navigation component.  It examines authentication state and
 * displays either the auth stack (login & register) or the main app
 * stack.  The app stack is further protected by role checks in the
 * respective screens.
 */
export default function Navigation() {
  const { user, loading } = useAuth();

  // While bootstrapping we return null to avoid rendering duplicate
  // screens; a splash screen could be shown here instead.
  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      {user ? (
        <Stack.Navigator>
          <Stack.Screen name="PostsList" component={PostsListScreen} options={{ title: 'Postagens' }} />
          <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Detalhes' }} />
          <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: 'Nova Postagem' }} />
          <Stack.Screen name="EditPost" component={EditPostScreen} options={{ title: 'Editar Post' }} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin' }} />
          <Stack.Screen name="Teachers" component={TeachersScreen} options={{ title: 'Professores' }} />
          <Stack.Screen name="Students" component={StudentsScreen} options={{ title: 'Estudantes' }} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}