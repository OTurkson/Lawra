package com.lawra.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Tenant {
// include users list. users belong to a tenant by unique email
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
}
