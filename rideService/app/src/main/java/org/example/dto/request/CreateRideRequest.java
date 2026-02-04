package org.example.dto.request;


import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CreateRideRequest {

    @NotBlank
    private String fromLocation;

    @NotBlank
    private String toLocation;

    @NotNull
    @Future
    private LocalDateTime departureTime;

    @NotNull
    @Positive
    private BigDecimal totalFare;

    @NotNull
    @Positive
    private Integer totalSeats;




}
