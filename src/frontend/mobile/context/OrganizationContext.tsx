import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Organization } from '../types';

const initialOrganizations: Organization[] = [
  { 
    id: '1', 
    name: 'Hogwarts School of Witchcraft and Wizardry', 
    domain: 'hogwarts.edu', 
    admin_name: 'Albus Dumbledore',
    admin_email: 'dumbledore@hogwarts.edu',
    color: '#740001',
    widgets: ['schedule', 'grades']
  },
  { 
    id: '2', 
    name: 'Stark Industries', 
    domain: 'starkindustries.com', 
    admin_name: 'Tony Stark',
    admin_email: 'tony@starkindustries.com',
    color: '#AA0000',
    widgets: ['news', 'map', 'assignments']
  },
  { 
    id: '3', 
    name: 'Wayne Enterprises', 
    domain: 'wayne-enterprises.com',
    admin_name: 'Bruce Wayne',
    admin_email: 'bruce@wayne-enterprises.com',
    color: '#000000',
    widgets: ['tasks', 'users']
  },
];

export type AddOrganizationData = Omit<Organization, 'id'> & {
  password?: string;
};

interface OrganizationContextType {
  organizations: Organization[];
  getOrganization: (id: string) => Organization | undefined;
  addOrganization: (orgData: AddOrganizationData) => void;
  updateOrganization: (org: Organization) => void;
  deleteOrganization: (id: string) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganizations = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganizations must be used within an OrganizationProvider');
  }
  return context;
};

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations);

  const getOrganization = (id: string) => {
    return organizations.find(org => org.id === id);
  };

  const addOrganization = (orgData: AddOrganizationData) => {
    // Don't store the password, just create the organization
    const { password, ...newOrgData } = orgData;
    const newOrg = { ...newOrgData, id: new Date().getTime().toString() };
    setOrganizations(prevOrgs => [...prevOrgs, newOrg]);
  };

  const updateOrganization = (updatedOrg: Organization) => {
    setOrganizations(prevOrgs =>
      prevOrgs.map(org => (org.id === updatedOrg.id ? updatedOrg : org))
    );
  };

  const deleteOrganization = (id: string) => {
    setOrganizations(prevOrgs => prevOrgs.filter(org => org.id !== id));
  };

  const value = {
    organizations,
    getOrganization,
    addOrganization,
    updateOrganization,
    deleteOrganization,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
