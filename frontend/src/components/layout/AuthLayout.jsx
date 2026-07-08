import React from 'react';
import AuthHeader from './AuthHeader.jsx';
import AuthFooter from './AuthFooter.jsx';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return <Outlet />;
};

export default AuthLayout;
