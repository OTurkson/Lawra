package com.lawra.backend.controller;

import com.lawra.backend.model.User;
import com.lawra.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

//    create, read, update, delete users
    @GetMapping
    public List<User> getUsers() {
        return userRepository.findAll();
    }

}
