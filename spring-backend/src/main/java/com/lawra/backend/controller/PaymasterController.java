package com.lawra.backend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/paymaster")
@PreAuthorize("hasRole('PAYMASTER') or hasRole('ADMIN')")
public class PaymasterController {

//    list all loan applications. Corresponding loans per borrower -> Borrower Controller

//    approve loan request
//      --> transfer money
//          --> Send Alert

//    reject loan request

}
