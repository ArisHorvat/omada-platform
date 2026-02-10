import { useRegistrationContext } from '../context/RegistrationContext';

export const useRegistrationLogic = () => {
  const { submitRegistration, isSubmitting } = useRegistrationContext();

  return {
    submitRegistration,
    isSubmitting
  };
};