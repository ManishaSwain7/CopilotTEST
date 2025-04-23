# CopilotTEST
# Add readme details

package com.calculator;

import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.println("Welcome to the CLI Calculator!");
        
        while (true) {
            System.out.print("Enter first number (or 'exit' to quit): ");
            String input1 = scanner.nextLine();
            if (input1.equalsIgnoreCase("exit")) {
                break;
            }
            
            System.out.print("Enter second number: ");
            String input2 = scanner.nextLine();
            
            System.out.print("Enter operation (+, -, *, /): ");
            String operation = scanner.nextLine();
            
            try {
                double num1 = Double.parseDouble(input1);
                double num2 = Double.parseDouble(input2);
                double result = 0;

                switch (operation) {
                    case "+":
                        result = num1 + num2;
                        break;
                    case "-":
                        result = num1 - num2;
                        break;
                    case "*":
                        result = num1 * num2;
                        break;
                    case "/":
                        if (num2 != 0) {
                            result = num1 / num2;
                        } else {
                            System.out.println("Error: Division by zero.");
                            continue;
                        }
                        break;
                    default:
                        System.out.println("Error: Invalid operation.");
                        continue;
                }
                
                System.out.println("Result: " + result);
            } catch (NumberFormatException e) {
                System.out.println("Error: Invalid number format.");
            }
        }
        
        scanner.close();
        System.out.println("Thank you for using the CLI Calculator!");
    }
}
